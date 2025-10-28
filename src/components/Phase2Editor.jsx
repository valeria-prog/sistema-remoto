import { useState } from 'react';
import { Code, Plus, Trash2, Edit2, Eye, FileCode, Settings, ChevronLeft, ChevronRight, Server } from 'lucide-react';

export default function Phase2Editor({ selectedProtocol, selectedTransport, procedures, setProcedures, onBack, onNext }) {
  const [currentProcedure, setCurrentProcedure] = useState({
    name: '',
    description: '',
    parameters: [],
    returnType: 'void'
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const dataTypes = ['string', 'int', 'float', 'boolean', 'double', 'long', 'byte[]'];

  const protocols = {
    grpc: 'gRPC',
    rmi: 'RMI',
    netremoting: '.NET Remoting'
  };

  const addParameter = () => {
    setCurrentProcedure({
      ...currentProcedure,
      parameters: [...currentProcedure.parameters, { name: '', type: 'string', direction: 'in' }]
    });
  };

  const updateParameter = (index, field, value) => {
    const newParams = [...currentProcedure.parameters];
    newParams[index][field] = value;
    setCurrentProcedure({ ...currentProcedure, parameters: newParams });
  };

  const removeParameter = (index) => {
    const newParams = currentProcedure.parameters.filter((_, i) => i !== index);
    setCurrentProcedure({ ...currentProcedure, parameters: newParams });
  };

  const saveProcedure = () => {
    if (!currentProcedure.name.trim()) return;
    
    if (editingIndex !== null) {
      const newProcedures = [...procedures];
      newProcedures[editingIndex] = { ...currentProcedure };
      setProcedures(newProcedures);
      setEditingIndex(null);
    } else {
      setProcedures([...procedures, { ...currentProcedure }]);
    }
    
    setCurrentProcedure({
      name: '',
      description: '',
      parameters: [],
      returnType: 'void'
    });
  };

  const editProcedure = (index) => {
    setCurrentProcedure({ ...procedures[index] });
    setEditingIndex(index);
  };

  const deleteProcedure = (index) => {
    setProcedures(procedures.filter((_, i) => i !== index));
  };

  const capitalizeFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const mapTypeToProto = (type) => {
    const map = {
      'string': 'string',
      'int': 'int32',
      'float': 'float',
      'boolean': 'bool',
      'double': 'double',
      'long': 'int64',
      'byte[]': 'bytes'
    };
    return map[type] || 'string';
  };

  const mapTypeToJava = (type) => {
    const map = {
      'string': 'String',
      'int': 'int',
      'float': 'float',
      'boolean': 'boolean',
      'double': 'double',
      'long': 'long',
      'byte[]': 'byte[]',
      'void': 'void'
    };
    return map[type] || 'Object';
  };

  const mapTypeToCSharp = (type) => {
    const map = {
      'string': 'string',
      'int': 'int',
      'float': 'float',
      'boolean': 'bool',
      'double': 'double',
      'long': 'long',
      'byte[]': 'byte[]',
      'void': 'void'
    };
    return map[type] || 'object';
  };

  const generateCode = () => {
    if (selectedProtocol === 'grpc') {
      return generateGrpcCode();
    } else if (selectedProtocol === 'rmi') {
      return generateRmiCode();
    } else if (selectedProtocol === 'netremoting') {
      return generateNetRemotingCode();
    }
    return '';
  };

  const generateGrpcCode = () => {
    let code = `syntax = "proto3";\n\npackage remote.procedures;\n\n`;
    
    procedures.forEach((proc, index) => {
      code += `// ${proc.description || 'Procedimiento ' + (index + 1)}\n`;
      code += `message ${capitalizeFirst(proc.name)}Request {\n`;
      proc.parameters.filter(p => p.direction === 'in').forEach((param, i) => {
        code += `  ${mapTypeToProto(param.type)} ${param.name} = ${i + 1};\n`;
      });
      code += `}\n\n`;
      
      code += `message ${capitalizeFirst(proc.name)}Response {\n`;
      if (proc.returnType !== 'void') {
        code += `  ${mapTypeToProto(proc.returnType)} result = 1;\n`;
      }
      proc.parameters.filter(p => p.direction === 'out').forEach((param, i) => {
        code += `  ${mapTypeToProto(param.type)} ${param.name} = ${i + 2};\n`;
      });
      code += `}\n\n`;
    });
    
    code += `service RemoteProcedureService {\n`;
    procedures.forEach(proc => {
      code += `  rpc ${capitalizeFirst(proc.name)} (${capitalizeFirst(proc.name)}Request) returns (${capitalizeFirst(proc.name)}Response);\n`;
    });
    code += `}\n`;
    
    return code;
  };

  const generateRmiCode = () => {
    let code = `import java.rmi.Remote;\nimport java.rmi.RemoteException;\n\n`;
    code += `public interface RemoteProcedureService extends Remote {\n\n`;
    
    procedures.forEach(proc => {
      code += `  // ${proc.description || 'Procedimiento remoto'}\n`;
      code += `  ${mapTypeToJava(proc.returnType)} ${proc.name}(`;
      const params = proc.parameters.map(p => `${mapTypeToJava(p.type)} ${p.name}`).join(', ');
      code += params;
      code += `) throws RemoteException;\n\n`;
    });
    
    code += `}\n`;
    return code;
  };

  const generateNetRemotingCode = () => {
    let code = `using System;\n\nnamespace RemoteProcedures\n{\n`;
    code += `  public interface IRemoteProcedureService\n  {\n\n`;
    
    procedures.forEach(proc => {
      code += `    // ${proc.description || 'Procedimiento remoto'}\n`;
      code += `    ${mapTypeToCSharp(proc.returnType)} ${capitalizeFirst(proc.name)}(`;
      const params = proc.parameters.map(p => `${mapTypeToCSharp(p.type)} ${p.name}`).join(', ');
      code += params;
      code += `);\n\n`;
    });
    
    code += `  }\n}\n`;
    return code;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="backdrop-blur-xl bg-pink-500/10 border-b border-pink-500/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-pink-500 to-fuchsia-600 rounded-lg">
                <Code className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-fuchsia-400">
                  Sistema de Procedimientos Remotos
                </h1>
                <p className="text-sm text-pink-300/70">Fase 2: Creación de Procedimientos</p>
              </div>
            </div>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-2 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 rounded-lg text-pink-200 transition-all duration-300 flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? 'Ocultar' : 'Ver'} Código
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Editor Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Procedure Editor */}
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-pink-500/20 p-6 shadow-2xl">
              <h2 className="text-xl font-semibold text-pink-300 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                {editingIndex !== null ? 'Editar Procedimiento' : 'Nuevo Procedimiento'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-pink-300/70 mb-2">Nombre del Procedimiento</label>
                  <input
                    type="text"
                    value={currentProcedure.name}
                    onChange={(e) => setCurrentProcedure({ ...currentProcedure, name: e.target.value })}
                    placeholder="calculateSum"
                    className="w-full px-4 py-3 bg-white/5 border border-pink-500/20 rounded-lg text-pink-200 placeholder-pink-300/30 focus:border-pink-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm text-pink-300/70 mb-2">Descripción</label>
                  <input
                    type="text"
                    value={currentProcedure.description}
                    onChange={(e) => setCurrentProcedure({ ...currentProcedure, description: e.target.value })}
                    placeholder="Calcula la suma de dos números"
                    className="w-full px-4 py-3 bg-white/5 border border-pink-500/20 rounded-lg text-pink-200 placeholder-pink-300/30 focus:border-pink-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm text-pink-300/70 mb-2">Tipo de Retorno</label>
                  <select
                    value={currentProcedure.returnType}
                    onChange={(e) => setCurrentProcedure({ ...currentProcedure, returnType: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-pink-500/20 rounded-lg text-pink-200 focus:border-pink-500 focus:outline-none transition-colors"
                  >
                    <option value="void">void</option>
                    {dataTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Parameters */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm text-pink-300/70">Parámetros</label>
                    <button
                      onClick={addParameter}
                      className="px-3 py-1 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 rounded-lg text-pink-200 text-sm transition-all duration-300 flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar
                    </button>
                  </div>

                  <div className="space-y-2">
                    {currentProcedure.parameters.map((param, index) => (
                      <div key={index} className="flex gap-2 items-center p-3 bg-white/5 rounded-lg border border-pink-500/10">
                        <input
                          type="text"
                          value={param.name}
                          onChange={(e) => updateParameter(index, 'name', e.target.value)}
                          placeholder="nombreParam"
                          className="flex-1 px-3 py-2 bg-white/5 border border-pink-500/20 rounded text-pink-200 text-sm placeholder-pink-300/30 focus:border-pink-500 focus:outline-none"
                        />
                        <select
                          value={param.type}
                          onChange={(e) => updateParameter(index, 'type', e.target.value)}
                          className="px-3 py-2 bg-white/5 border border-pink-500/20 rounded text-pink-200 text-sm focus:border-pink-500 focus:outline-none"
                        >
                          {dataTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                        <select
                          value={param.direction}
                          onChange={(e) => updateParameter(index, 'direction', e.target.value)}
                          className="px-3 py-2 bg-white/5 border border-pink-500/20 rounded text-pink-200 text-sm focus:border-pink-500 focus:outline-none"
                        >
                          <option value="in">IN</option>
                          <option value="out">OUT</option>
                        </select>
                        <button
                          onClick={() => removeParameter(index)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded text-red-300 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {currentProcedure.parameters.length === 0 && (
                      <p className="text-center text-pink-300/40 text-sm py-4">
                        No hay parámetros. Haz clic en "Agregar" para crear uno.
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={saveProcedure}
                  disabled={!currentProcedure.name.trim()}
                  className="w-full py-3 bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-lg font-semibold text-white shadow-lg shadow-pink-500/50 hover:shadow-pink-500/70 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {editingIndex !== null ? 'Actualizar Procedimiento' : 'Guardar Procedimiento'}
                </button>
              </div>
            </div>

            {/* Procedures List */}
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-pink-500/20 p-6 shadow-2xl">
              <h2 className="text-xl font-semibold text-pink-300 mb-4 flex items-center gap-2">
                <FileCode className="w-5 h-5" />
                Procedimientos Creados ({procedures.length})
              </h2>

              <div className="space-y-3">
                {procedures.map((proc, index) => (
                  <div key={index} className="p-4 bg-white/5 rounded-lg border border-pink-500/10 hover:border-pink-500/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-pink-200">{proc.name}</h3>
                          <span className="px-2 py-0.5 bg-fuchsia-500/20 text-fuchsia-300 text-xs rounded-full">
                            {proc.returnType}
                          </span>
                        </div>
                        {proc.description && (
                          <p className="text-sm text-pink-300/60 mb-2">{proc.description}</p>
                        )}
                        <div className="flex gap-1 flex-wrap">
                          {proc.parameters.map((param, i) => (
                            <span key={i} className="px-2 py-0.5 bg-pink-500/10 text-pink-300 text-xs rounded border border-pink-500/20">
                              {param.name}: {param.type} ({param.direction})
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => editProcedure(index)}
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded text-blue-300 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteProcedure(index)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded text-red-300 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {procedures.length === 0 && (
                  <div className="text-center py-8">
                    <Code className="w-12 h-12 mx-auto text-pink-300/30 mb-3" />
                    <p className="text-pink-300/60">No hay procedimientos creados</p>
                    <p className="text-pink-300/40 text-sm">Crea tu primer procedimiento arriba</p>
                  </div>
                )}
              </div>
            </div>

            {/* Code Preview */}
            {showPreview && procedures.length > 0 && (
              <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-pink-500/20 p-6 shadow-2xl animate-in fade-in duration-300">
                <h2 className="text-xl font-semibold text-pink-300 mb-4 flex items-center gap-2">
                  <FileCode className="w-5 h-5" />
                  Código Generado - {protocols[selectedProtocol]}
                </h2>
                <pre className="bg-slate-900/50 p-4 rounded-lg overflow-x-auto border border-pink-500/10">
                  <code className="text-pink-200 text-sm">{generateCode()}</code>
                </pre>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <button
                onClick={onBack}
                className="group px-6 py-3 bg-white/5 hover:bg-white/10 border border-pink-500/20 rounded-lg text-pink-200 transition-all duration-300 flex items-center gap-2"
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Volver a Fase 1
              </button>

              {procedures.length > 0 && (
                <button
                  onClick={onNext}
                  className="group px-8 py-3 bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-lg font-semibold text-white shadow-lg shadow-pink-500/50 hover:shadow-pink-500/70 hover:scale-105 transition-all duration-300 flex items-center gap-2"
                >
                  Continuar a Fase 3
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
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

                <div className="pt-4 border-t border-pink-500/20">
                  <p className="text-xs text-pink-300/40 mb-2">Siguiente paso</p>
                  <p className="text-sm text-pink-300/60">
                    Crea al menos un procedimiento para continuar a la fase de pruebas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}