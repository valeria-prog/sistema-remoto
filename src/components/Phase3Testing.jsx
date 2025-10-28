import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { 
  ChevronLeft, 
  Play, 
  Server, 
  Monitor, 
  Activity, 
  Zap, 
  CheckCircle, 
  XCircle, 
  Clock,
  Network,
  Download,
  Terminal
} from 'lucide-react';

export default function Phase3Testing({ selectedProtocol, selectedTransport, procedures, onBack }) {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [serverConfig, setServerConfig] = useState({ host: 'localhost', port: '8080' });
  const [selectedProcedure, setSelectedProcedure] = useState(null);
  const [paramValues, setParamValues] = useState({});
  const [logs, setLogs] = useState([]);
  const [statistics, setStatistics] = useState({ calls: 0, success: 0, failed: 0, avgLatency: 0 });
  const [socket, setSocket] = useState(null);

  const protocols = {
    grpc: 'gRPC',
    rmi: 'RMI',
    netremoting: '.NET Remoting'
  };

  // Conectar WebSocket cuando el componente se monta
  useEffect(() => {
    const newSocket = io('http://localhost:8080');
    
    newSocket.on('connect', () => {
      console.log('WebSocket conectado');
    });

    newSocket.on('log', (logData) => {
      addLog(logData.type, logData.message);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket desconectado');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (selectedProcedure) {
      const initialValues = {};
      procedures[selectedProcedure].parameters
        .filter(p => p.direction === 'in')
        .forEach(param => {
          initialValues[param.name] = getDefaultValue(param.type);
        });
      setParamValues(initialValues);
    }
  }, [selectedProcedure, procedures]);

  const getDefaultValue = (type) => {
    const defaults = {
      'string': '',
      'int': '0',
      'float': '0.0',
      'boolean': 'false',
      'double': '0.0',
      'long': '0',
      'byte[]': ''
    };
    return defaults[type] || '';
  };

  const addLog = (type, message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { type, message, timestamp }]);
  };

  const connectServer = async () => {
    setConnectionStatus('connecting');
    addLog('info', `Intentando conectar a ${serverConfig.host}:${serverConfig.port}`);
    
    try {
      // Registrar procedimientos en el backend
      await fetch('http://localhost:8080/api/procedures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol: selectedProtocol,
          transport: selectedTransport,
          procedures: procedures
        })
      });

      // Conectar
      const response = await fetch('http://localhost:8080/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serverConfig)
      });

      const data = await response.json();

      if (data.success) {
        setConnectionStatus('connected');
        addLog('success', `✓ Conexión establecida via ${selectedTransport.toUpperCase()}`);
        addLog('info', `Protocolo: ${protocols[selectedProtocol]}`);
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      addLog('error', `✗ Error: ${error.message}`);
    }
  };


  const disconnectServer = () => {
    setConnectionStatus('disconnected');
    addLog('warning', 'Conexión cerrada');
  };

  const executeProcedure = async () => {
    if (connectionStatus !== 'connected' || selectedProcedure === null) return;

    const procedure = procedures[selectedProcedure];
    const startTime = Date.now();

    try {
      const response = await fetch('http://localhost:8080/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          procedureName: procedure.name,
          parameters: paramValues
        })
      });

      const data = await response.json();
      const latency = Date.now() - startTime;

      // Actualizar estadísticas
      if (data.success) {
        setStatistics(prev => ({
          calls: prev.calls + 1,
          success: prev.success + 1,
          failed: prev.failed,
          avgLatency: Math.round((prev.avgLatency * prev.calls + latency) / (prev.calls + 1))
        }));
      } else {
        setStatistics(prev => ({
          calls: prev.calls + 1,
          success: prev.success,
          failed: prev.failed + 1,
          avgLatency: Math.round((prev.avgLatency * prev.calls + latency) / (prev.calls + 1))
        }));
      }

    } catch (error) {
      addLog('error', `✗ Error de conexión: ${error.message}`);
      setStatistics(prev => ({
        ...prev,
        calls: prev.calls + 1,
        failed: prev.failed + 1
      }));
    }
  };

  const generateMockResult = (returnType) => {
    const mocks = {
      'void': 'void',
      'string': '"Resultado exitoso"',
      'int': Math.floor(Math.random() * 1000),
      'float': (Math.random() * 100).toFixed(2),
      'boolean': Math.random() > 0.5 ? 'true' : 'false',
      'double': (Math.random() * 1000).toFixed(4),
      'long': Math.floor(Math.random() * 10000),
      'byte[]': '[0x4A, 0x2F, 0x8B]'
    };
    return mocks[returnType] || 'null';
  };

  const exportConfig = () => {
    const config = {
      protocol: selectedProtocol,
      transport: selectedTransport,
      server: serverConfig,
      procedures: procedures,
      statistics: statistics
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `remote-procedures-config.json`;
    a.click();
    
    addLog('success', '✓ Configuración exportada');
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="backdrop-blur-xl bg-pink-500/10 border-b border-pink-500/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-pink-500 to-fuchsia-600 rounded-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-fuchsia-400">
                  Sistema de Procedimientos Remotos
                </h1>
                <p className="text-sm text-pink-300/70">Fase 3: Pruebas y Ejecución</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                connectionStatus === 'connected' 
                  ? 'bg-green-500/20 border-green-500/30 text-green-300' 
                  : connectionStatus === 'connecting'
                  ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300'
                  : 'bg-red-500/20 border-red-500/30 text-red-300'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 
                  'bg-red-400'
                }`} />
                <span className="text-sm font-medium capitalize">{connectionStatus}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Server Configuration */}
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-pink-500/20 p-6 shadow-2xl">
              <h2 className="text-xl font-semibold text-pink-300 mb-4 flex items-center gap-2">
                <Server className="w-5 h-5" />
                Configuración del Servidor
              </h2>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-sm text-pink-300/70 mb-2">Host</label>
                  <input
                    type="text"
                    value={serverConfig.host}
                    onChange={(e) => setServerConfig({ ...serverConfig, host: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-pink-500/20 rounded-lg text-pink-200 focus:border-pink-500 focus:outline-none"
                    disabled={connectionStatus === 'connected'}
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm text-pink-300/70 mb-2">Puerto</label>
                  <input
                    type="text"
                    value={serverConfig.port}
                    onChange={(e) => setServerConfig({ ...serverConfig, port: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-pink-500/20 rounded-lg text-pink-200 focus:border-pink-500 focus:outline-none"
                    disabled={connectionStatus === 'connected'}
                  />
                </div>

                <div className="md:col-span-1 flex items-end">
                  {connectionStatus === 'connected' ? (
                    <button
                      onClick={disconnectServer}
                      className="w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-300 transition-all duration-300 font-medium"
                    >
                      Desconectar
                    </button>
                  ) : (
                    <button
                      onClick={connectServer}
                      disabled={connectionStatus === 'connecting'}
                      className="w-full px-4 py-2 bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-lg text-white font-medium hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {connectionStatus === 'connecting' ? 'Conectando...' : 'Conectar'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Procedure Execution */}
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-pink-500/20 p-6 shadow-2xl">
              <h2 className="text-xl font-semibold text-pink-300 mb-4 flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Ejecutar Procedimiento
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-pink-300/70 mb-2">Seleccionar Procedimiento</label>
                  <select
                    value={selectedProcedure ?? ''}
                    onChange={(e) => setSelectedProcedure(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-2 bg-white/5 border border-pink-500/20 rounded-lg text-pink-200 focus:border-pink-500 focus:outline-none"
                    disabled={connectionStatus !== 'connected'}
                  >
                    <option value="">-- Selecciona un procedimiento --</option>
                    {procedures.map((proc, index) => (
                      <option key={index} value={index}>
                        {proc.name} ({proc.returnType})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProcedure !== null && procedures[selectedProcedure].parameters.filter(p => p.direction === 'in').length > 0 && (
                  <div className="space-y-3">
                    <label className="block text-sm text-pink-300/70">Parámetros de Entrada</label>
                    {procedures[selectedProcedure].parameters
                      .filter(p => p.direction === 'in')
                      .map((param, index) => (
                        <div key={index} className="flex gap-3 items-center">
                          <span className="text-pink-300 text-sm min-w-[100px]">{param.name}:</span>
                          <input
                            type="text"
                            value={paramValues[param.name] || ''}
                            onChange={(e) => setParamValues({ ...paramValues, [param.name]: e.target.value })}
                            placeholder={param.type}
                            className="flex-1 px-4 py-2 bg-white/5 border border-pink-500/20 rounded-lg text-pink-200 placeholder-pink-300/30 focus:border-pink-500 focus:outline-none"
                          />
                          <span className="text-pink-300/50 text-sm min-w-[60px]">{param.type}</span>
                        </div>
                      ))}
                  </div>
                )}

                <button
                  onClick={executeProcedure}
                  disabled={connectionStatus !== 'connected' || selectedProcedure === null}
                  className="w-full py-3 bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-lg font-semibold text-white shadow-lg shadow-pink-500/50 hover:shadow-pink-500/70 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <Play className="w-5 h-5" />
                  Ejecutar Llamada Remota
                </button>
              </div>
            </div>

            {/* Console Log */}
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-pink-500/20 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-pink-300 flex items-center gap-2">
                  <Terminal className="w-5 h-5" />
                  Console Log
                </h2>
                <button
                  onClick={clearLogs}
                  className="px-3 py-1 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 rounded text-pink-200 text-sm transition-colors"
                >
                  Limpiar
                </button>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 h-64 overflow-y-auto border border-pink-500/10 font-mono text-sm">
                {logs.length === 0 ? (
                  <p className="text-pink-300/40 text-center py-8">No hay logs todavía...</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className={`py-1 ${
                      log.type === 'success' ? 'text-green-300' :
                      log.type === 'error' ? 'text-red-300' :
                      log.type === 'warning' ? 'text-yellow-300' :
                      'text-pink-200'
                    }`}>
                      <span className="text-pink-400/60">[{log.timestamp}]</span> {log.message}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={onBack}
                className="group px-6 py-3 bg-white/5 hover:bg-white/10 border border-pink-500/20 rounded-lg text-pink-200 transition-all duration-300 flex items-center gap-2"
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Volver a Fase 2
              </button>

              <button
                onClick={exportConfig}
                className="group px-6 py-3 bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-lg font-semibold text-white shadow-lg shadow-pink-500/50 hover:shadow-pink-500/70 hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Exportar Configuración
              </button>
            </div>
          </div>

          {/* Sidebar - Statistics */}
          <div className="lg:col-span-1 space-y-6">
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-pink-500/20 p-6 shadow-2xl sticky top-24">
              <h3 className="text-lg font-semibold text-pink-300 mb-4">
                Configuración
              </h3>

              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-lg border border-pink-500/10">
                  <p className="text-xs text-pink-300/60 mb-1">Protocolo</p>
                  <p className="text-lg font-bold text-pink-200">
                    {protocols[selectedProtocol]}
                  </p>
                </div>

                <div className="p-4 bg-white/5 rounded-lg border border-pink-500/10">
                  <p className="text-xs text-pink-300/60 mb-1">Transporte</p>
                  <p className="text-lg font-bold text-pink-200 uppercase">
                    {selectedTransport}
                  </p>
                </div>

                <div className="p-4 bg-white/5 rounded-lg border border-pink-500/10">
                  <p className="text-xs text-pink-300/60 mb-1">Procedimientos</p>
                  <p className="text-lg font-bold text-pink-200">
                    {procedures.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-pink-500/20 p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-pink-300 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Estadísticas
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-blue-400" />
                    <span className="text-pink-300/70 text-sm">Total Llamadas</span>
                  </div>
                  <span className="text-pink-200 font-bold">{statistics.calls}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-pink-300/70 text-sm">Exitosas</span>
                  </div>
                  <span className="text-green-300 font-bold">{statistics.success}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-pink-300/70 text-sm">Fallidas</span>
                  </div>
                  <span className="text-red-300 font-bold">{statistics.failed}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span className="text-pink-300/70 text-sm">Latencia Promedio</span>
                  </div>
                  <span className="text-purple-300 font-bold">{statistics.avgLatency}ms</span>
                </div>
              </div>

              {statistics.calls > 0 && (
                <div className="mt-4 p-3 bg-gradient-to-br from-pink-500/10 to-fuchsia-500/10 rounded-lg border border-pink-500/30">
                  <p className="text-xs text-pink-300/60 mb-1">Tasa de Éxito</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-full transition-all duration-500"
                        style={{ width: `${(statistics.success / statistics.calls) * 100}%` }}
                      />
                    </div>
                    <span className="text-pink-200 font-bold text-sm">
                      {Math.round((statistics.success / statistics.calls) * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}