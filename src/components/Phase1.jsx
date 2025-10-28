import { Server, Network, Radio, ChevronRight, Check, Wifi } from "lucide-react";

export default function Phase1({ selectedProtocol, setSelectedProtocol, selectedTransport, setSelectedTransport, onNext }) {
  const protocols = [
    {
      id: "grpc",
      name: "gRPC",
      icon: Server,
      description: "Protocol Buffers con HTTP/2",
      color: "from-pink-400 to-rose-500",
    },
    {
      id: "rmi",
      name: "RMI",
      icon: Network,
      description: "Java Remote Method Invocation",
      color: "from-rose-400 to-pink-500",
    },
    {
      id: "netremoting",
      name: ".NET Remoting",
      icon: Wifi,
      description: "Microsoft .NET Framework",
      color: "from-fuchsia-400 to-pink-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="backdrop-blur-xl bg-pink-500/10 border-b border-pink-500/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-pink-500 to-fuchsia-600 rounded-lg">
              <Radio className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-fuchsia-400">
                Sistema de Procedimientos Remotos
              </h1>
              <p className="text-sm text-pink-300/70">Fase 1: Configuración de Protocolo</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Protocol Selection */}
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-pink-500/20 p-6 shadow-2xl">
              <h2 className="text-xl font-semibold text-pink-300 mb-4 flex items-center gap-2">
                <Server className="w-5 h-5" />
                Selecciona el Protocolo
              </h2>

              <div className="grid md:grid-cols-3 gap-4">
                {protocols.map((protocol) => {
                  const Icon = protocol.icon;
                  const isSelected = selectedProtocol === protocol.id;

                  return (
                    <button
                      key={protocol.id}
                      onClick={() => setSelectedProtocol(protocol.id)}
                      className={`relative group p-6 rounded-xl border-2 transition-all duration-300 ${
                        isSelected
                          ? "border-pink-500 bg-pink-500/20 scale-105"
                          : "border-pink-500/20 bg-white/5 hover:border-pink-500/50 hover:bg-white/10"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-br from-pink-500 to-fuchsia-600 rounded-full p-1">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}

                      <div className={`w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br ${protocol.color} flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>

                      <h3 className="text-lg font-bold text-pink-200 mb-2">
                        {protocol.name}
                      </h3>
                      <p className="text-sm text-pink-300/60">
                        {protocol.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Transport Selection */}
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-pink-500/20 p-6 shadow-2xl">
              <h2 className="text-xl font-semibold text-pink-300 mb-4 flex items-center gap-2">
                <Network className="w-5 h-5" />
                Protocolo de Transporte
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedTransport("tcp")}
                  className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                    selectedTransport === "tcp"
                      ? "border-pink-500 bg-pink-500/20"
                      : "border-pink-500/20 bg-white/5 hover:border-pink-500/50 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-pink-200">TCP</h3>
                    <div className={`w-16 h-8 rounded-full transition-colors duration-300 ${
                      selectedTransport === "tcp" ? "bg-pink-500" : "bg-pink-500/20"
                    } relative`}>
                      <div className={`absolute top-1 transition-all duration-300 w-6 h-6 bg-white rounded-full ${
                        selectedTransport === "tcp" ? "left-9" : "left-1"
                      }`} />
                    </div>
                  </div>
                  <p className="text-sm text-pink-300/60 text-left">
                    Transmission Control Protocol - Conexión confiable y ordenada
                  </p>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">
                      Confiable
                    </span>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                      Ordenado
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedTransport("udp")}
                  className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                    selectedTransport === "udp"
                      ? "border-pink-500 bg-pink-500/20"
                      : "border-pink-500/20 bg-white/5 hover:border-pink-500/50 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-pink-200">UDP</h3>
                    <div className={`w-16 h-8 rounded-full transition-colors duration-300 ${
                      selectedTransport === "udp" ? "bg-pink-500" : "bg-pink-500/20"
                    } relative`}>
                      <div className={`absolute top-1 transition-all duration-300 w-6 h-6 bg-white rounded-full ${
                        selectedTransport === "udp" ? "left-9" : "left-1"
                      }`} />
                    </div>
                  </div>
                  <p className="text-sm text-pink-300/60 text-left">
                    User Datagram Protocol - Rápido sin garantías de entrega
                  </p>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">
                      Rápido
                    </span>
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                      Low latency
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Next Phase Button */}
            {selectedProtocol && (
              <div className="flex justify-end animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button 
                  onClick={onNext}
                  className="group px-8 py-4 bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-xl font-semibold text-white shadow-lg shadow-pink-500/50 hover:shadow-pink-500/70 hover:scale-105 transition-all duration-300 flex items-center gap-2"
                >
                  Continuar a Fase 2
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-pink-500/20 p-6 shadow-2xl sticky top-24">
              <h3 className="text-lg font-semibold text-pink-300 mb-4">
                Configuración Actual
              </h3>

              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-lg border border-pink-500/10">
                  <p className="text-xs text-pink-300/60 mb-1">Protocolo</p>
                  <p className="text-lg font-bold text-pink-200">
                    {selectedProtocol
                      ? protocols.find((p) => p.id === selectedProtocol)?.name
                      : "No seleccionado"}
                  </p>
                </div>

                <div className="p-4 bg-white/5 rounded-lg border border-pink-500/10">
                  <p className="text-xs text-pink-300/60 mb-1">Transporte</p>
                  <p className="text-lg font-bold text-pink-200 uppercase">
                    {selectedTransport}
                  </p>
                </div>

                {selectedProtocol && (
                  <div className="p-4 bg-gradient-to-br from-pink-500/10 to-fuchsia-500/10 rounded-lg border border-pink-500/30 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <p className="text-xs text-pink-300/60 mb-2">Estado</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <p className="text-sm font-medium text-pink-200">
                        Listo para continuar
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-pink-500/20">
                  <p className="text-xs text-pink-300/40 mb-2">Siguiente paso</p>
                  <p className="text-sm text-pink-300/60">
                    Selecciona un protocolo para continuar a la fase de creación de procedimientos.
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