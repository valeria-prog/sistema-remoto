from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from services.executor import ProcedureExecutor
from services.code_generator import CodeGenerator
import time
import os
import zipfile
from io import BytesIO

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

executor = ProcedureExecutor()
code_generator = CodeGenerator()

executor.set_socketio(socketio)

@app.route('/api/procedures', methods=['POST'])
def register_procedures():
    data = request.json
    protocol = data.get('protocol')
    transport = data.get('transport')
    procedures = data.get('procedures', [])
    
    executor.register(protocol, transport, procedures)
    
    # Generar código
    try:
        generated = code_generator.generate_all(protocol, transport, procedures)
        return jsonify({
            'success': True,
            'message': f'{len(procedures)} procedimientos registrados',
            'protocol': protocol,
            'transport': transport,
            'generated': generated
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/execute', methods=['POST'])
def execute_procedure():
    data = request.json
    procedure_name = data.get('procedureName')
    parameters = data.get('parameters', {})
    
    start_time = time.time()
    
    try:
        result = executor.execute(procedure_name, parameters)
        latency = int((time.time() - start_time) * 1000)
        
        # Enviar log final con latencia
        executor.emit_log('success', f'⚡ Latencia: {latency}ms')
        
        return jsonify({
            'success': True,
            'result': result,
            'latency': latency
        })
    except Exception as e:
        latency = int((time.time() - start_time) * 1000)
        executor.emit_log('error', f'✗ Error: {str(e)}')
        executor.emit_log('error', f'✗ La llamada falló después de {latency}ms')
        
        return jsonify({
            'success': False,
            'error': str(e),
            'latency': latency
        }), 400

@app.route('/api/connect', methods=['POST'])
def connect():
    data = request.json
    host = data.get('host', 'localhost')
    port = data.get('port', '8080')
    
    return jsonify({
        'success': True,
        'message': f'Conectado a {host}:{port}',
        'status': 'connected'
    })

@app.route('/api/download/code', methods=['GET'])
def download_code():
    """Descargar todos los archivos generados como ZIP"""
    protocol = request.args.get('protocol', 'grpc')
    
    try:
        # Crear ZIP en memoria
        memory_file = BytesIO()
        with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
            protocol_path = os.path.join('generated', protocol)
            
            # Agregar todos los archivos del protocolo al ZIP
            for root, dirs, files in os.walk(protocol_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, protocol_path)
                    zf.write(file_path, arcname)
        
        memory_file.seek(0)
        
        return send_file(
            memory_file,
            mimetype='application/zip',
            as_attachment=True,
            download_name=f'{protocol}_generated_code.zip'
        )
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/preview/code', methods=['GET'])
def preview_code():
    """Vista previa del código generado"""
    protocol = request.args.get('protocol', 'grpc')
    file_type = request.args.get('type', 'proto')  # proto, server, client, interface
    
    try:
        protocol_path = os.path.join('generated', protocol)
        
        # Mapeo de tipos de archivo por protocolo
        file_mapping = {
            'grpc': {
                'proto': 'service.proto',
                'server': 'server.py',
                'client': 'client.py'
            },
            'rmi': {
                'interface': 'RemoteProcedureService.java',
                'server': 'RemoteProcedureServer.java',
                'client': 'RemoteProcedureClient.java'
            },
            'netremoting': {
                'interface': 'IRemoteProcedureService.cs',
                'server': 'RemoteProcedureServer.cs',
                'client': 'RemoteProcedureClient.cs'
            }
        }
        
        filename = file_mapping.get(protocol, {}).get(file_type)
        if not filename:
            return jsonify({'success': False, 'error': 'Tipo de archivo no válido'}), 400
        
        file_path = os.path.join(protocol_path, filename)
        
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                content = f.read()
            
            return jsonify({
                'success': True,
                'filename': filename,
                'content': content,
                'protocol': protocol,
                'type': file_type
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Archivo no encontrado'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@socketio.on('connect')
def handle_connect():
    print('Cliente conectado al WebSocket')
    emit('connection_response', {'status': 'connected'})

@socketio.on('disconnect')
def handle_disconnect():
    print('Cliente desconectado del WebSocket')
    
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=8080, debug=True, allow_unsafe_werkzeug=True)