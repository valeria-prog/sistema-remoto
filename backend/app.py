from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from services.executor import ProcedureExecutor
import time

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

executor = ProcedureExecutor()

# Variable global para almacenar el socketio
executor.set_socketio(socketio)

@app.route('/api/procedures', methods=['POST'])
def register_procedures():
    data = request.json
    protocol = data.get('protocol')
    transport = data.get('transport')
    procedures = data.get('procedures', [])
    
    executor.register(protocol, transport, procedures)
    
    return jsonify({
        'success': True,
        'message': f'{len(procedures)} procedimientos registrados',
        'protocol': protocol,
        'transport': transport
    })

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

@socketio.on('connect')
def handle_connect():
    print('Cliente conectado al WebSocket')
    emit('connection_response', {'status': 'connected'})

@socketio.on('disconnect')
def handle_disconnect():
    print('Cliente desconectado del WebSocket')

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=8080, debug=True, allow_unsafe_werkzeug=True)