import time
from datetime import datetime

class ProcedureExecutor:
    def __init__(self):
        self.procedures = {}
        self.protocol = None
        self.transport = None
        self.socketio = None
    
    def set_socketio(self, socketio):
        """Configurar la instancia de SocketIO para emitir logs"""
        self.socketio = socketio
    
    def emit_log(self, log_type, message):
        """Emitir log en tiempo real via WebSocket"""
        timestamp = datetime.now().strftime('%I:%M:%S %p')
        log_data = {
            'type': log_type,
            'message': message,
            'timestamp': timestamp
        }
        
        if self.socketio:
            self.socketio.emit('log', log_data)
        
        print(f"[{timestamp}] [{log_type}] {message}")
    
    def register(self, protocol, transport, procedures):
        self.protocol = protocol
        self.transport = transport
        
        for proc in procedures:
            self.procedures[proc['name']] = proc
        
        self.emit_log('info', f'Registrados {len(procedures)} procedimientos')
        self.emit_log('info', f'Protocolo: {protocol}, Transporte: {transport.upper()}')
    
    def execute(self, procedure_name, parameters):
        if procedure_name not in self.procedures:
            self.emit_log('error', f'Procedimiento "{procedure_name}" no encontrado')
            raise ValueError(f'Procedimiento "{procedure_name}" no encontrado')
        
        procedure = self.procedures[procedure_name]
        
        self.emit_log('info', f'→ Ejecutando: {procedure_name}()')
        self.emit_log('info', f'Serializando parámetros...')
        
        time.sleep(0.2)  # Simular serialización
        
        params_str = ', '.join([f'{k}={v}' for k, v in parameters.items()])
        self.emit_log('success', f'✓ Serialización completa: {{{params_str}}}')
        
        self.emit_log('info', f'Transmitiendo via {self.transport.upper()}...')
        time.sleep(0.3)  # Simular transmisión
        
        self.emit_log('success', f'✓ Paquete enviado')
        self.emit_log('info', f'Esperando respuesta del servidor...')
        
        time.sleep(0.2)  # Simular espera
        
        # EJECUTAR LÓGICA REAL
        result = self._execute_logic(procedure_name, parameters, procedure)
        
        time.sleep(0.2)  # Simular procesamiento
        
        self.emit_log('success', f'✓ Respuesta recibida: {result}')
        self.emit_log('success', f'✓ Deserialización completa')
        self.emit_log('info', '---')
        
        return result
    
    def _execute_logic(self, name, params, procedure):
        """Ejecuta la lógica real del procedimiento"""
        
        # Operaciones aritméticas comunes
        if name in ['suma', 'sumar', 'add']:
            return sum([self._cast_value(v, 'int') for v in params.values()])
        
        elif name in ['resta', 'restar', 'subtract']:
            values = [self._cast_value(v, 'int') for v in params.values()]
            return values[0] - sum(values[1:])
        
        elif name in ['multiplica', 'multiplicar', 'multiply']:
            result = 1
            for v in params.values():
                result *= self._cast_value(v, 'int')
            return result
        
        elif name in ['divide', 'dividir', 'division']:
            values = [self._cast_value(v, 'float') for v in params.values()]
            if values[1] == 0:
                raise ValueError("División por cero")
            return round(values[0] / values[1], 2)
        
        # Operaciones con strings
        elif name in ['concatenar', 'concat']:
            return ''.join([str(v) for v in params.values()])
        
        elif name in ['longitud', 'length']:
            first_param = list(params.values())[0]
            return len(str(first_param))
        
        # Operaciones lógicas
        elif name in ['y', 'and']:
            return all([self._cast_value(v, 'boolean') for v in params.values()])
        
        elif name in ['o', 'or']:
            return any([self._cast_value(v, 'boolean') for v in params.values()])
        
        # Genérico: intentar sumar si son números
        else:
            try:
                return sum([self._cast_value(v, 'int') for v in params.values()])
            except:
                return f"Resultado de {name}"
    
    def _cast_value(self, value, target_type):
        """Convierte valores al tipo correcto"""
        if target_type == 'int':
            return int(float(value))
        elif target_type == 'float':
            return float(value)
        elif target_type == 'boolean':
            return str(value).lower() in ['true', '1', 'yes']
        else:
            return str(value)