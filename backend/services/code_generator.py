import os
from datetime import datetime

class CodeGenerator:
    def __init__(self):
        self.base_path = os.path.join(os.path.dirname(__file__), '..', 'generated')
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Crear directorios si no existen"""
        for protocol in ['grpc', 'rmi', 'netremoting']:
            path = os.path.join(self.base_path, protocol)
            os.makedirs(path, exist_ok=True)
    
    def generate_all(self, protocol, transport, procedures):
        """Generar código según el protocolo"""
        if protocol == 'grpc':
            return self.generate_grpc(procedures, transport)
        elif protocol == 'rmi':
            return self.generate_rmi(procedures, transport)
        elif protocol == 'netremoting':
            return self.generate_netremoting(procedures, transport)
        else:
            raise ValueError(f"Protocolo desconocido: {protocol}")
    
    # ==================== gRPC ====================
    def generate_grpc(self, procedures, transport):
        """Generar archivos .proto y Python para gRPC"""
        proto_content = self._generate_proto(procedures)
        python_server = self._generate_grpc_server(procedures, transport)
        python_client = self._generate_grpc_client(procedures, transport)
        
        # Guardar archivos
        proto_path = os.path.join(self.base_path, 'grpc', 'service.proto')
        server_path = os.path.join(self.base_path, 'grpc', 'server.py')
        client_path = os.path.join(self.base_path, 'grpc', 'client.py')
        
        with open(proto_path, 'w') as f:
            f.write(proto_content)
        with open(server_path, 'w') as f:
            f.write(python_server)
        with open(client_path, 'w') as f:
            f.write(python_client)
        
        return {
            'proto': proto_content,
            'server': python_server,
            'client': python_client,
            'files': {
                'service.proto': proto_path,
                'server.py': server_path,
                'client.py': client_path
            }
        }
    
    def _generate_proto(self, procedures):
        """Generar archivo .proto"""
        code = 'syntax = "proto3";\n\n'
        code += 'package remote.procedures;\n\n'
        code += f'// Generado automáticamente el {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n\n'
        
        # Generar mensajes para cada procedimiento
        for proc in procedures:
            proc_name = self._capitalize(proc['name'])
            
            # Request message
            code += f'// {proc.get("description", "Procedimiento remoto")}\n'
            code += f'message {proc_name}Request {{\n'
            in_params = [p for p in proc['parameters'] if p['direction'] == 'in']
            for i, param in enumerate(in_params, 1):
                proto_type = self._map_type_to_proto(param['type'])
                code += f'  {proto_type} {param["name"]} = {i};\n'
            code += '}\n\n'
            
            # Response message
            code += f'message {proc_name}Response {{\n'
            if proc['returnType'] != 'void':
                proto_type = self._map_type_to_proto(proc['returnType'])
                code += f'  {proto_type} result = 1;\n'
            out_params = [p for p in proc['parameters'] if p['direction'] == 'out']
            for i, param in enumerate(out_params, 2):
                proto_type = self._map_type_to_proto(param['type'])
                code += f'  {proto_type} {param["name"]} = {i};\n'
            code += '}\n\n'
        
        # Service definition
        code += 'service RemoteProcedureService {\n'
        for proc in procedures:
            proc_name = self._capitalize(proc['name'])
            code += f'  rpc {proc_name} ({proc_name}Request) returns ({proc_name}Response);\n'
        code += '}\n'
        
        return code
    
    def _generate_grpc_server(self, procedures, transport):
        """Generar servidor Python para gRPC"""
        code = '#!/usr/bin/env python\n'
        code += '# -*- coding: utf-8 -*-\n'
        code += f'# Generado automáticamente el {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n\n'
        code += 'import grpc\n'
        code += 'from concurrent import futures\n'
        code += 'import service_pb2\n'
        code += 'import service_pb2_grpc\n\n'
        
        code += 'class RemoteProcedureServicer(service_pb2_grpc.RemoteProcedureServiceServicer):\n'
        code += '    """Implementación del servicio de procedimientos remotos"""\n\n'
        
        # Generar métodos para cada procedimiento
        for proc in procedures:
            proc_name = self._capitalize(proc['name'])
            code += f'    def {proc_name}(self, request, context):\n'
            code += f'        """{proc.get("description", "Procedimiento remoto")}"""\n'
            code += '        # TODO: Implementar lógica del procedimiento\n'
            
            # Ejemplo de implementación básica
            # Aceptar también el alias 'sum' (inglés corto)
            if proc['name'] in ['suma', 'sumar', 'add', 'sum']:
                in_params = [p for p in proc['parameters'] if p['direction'] == 'in']
                if in_params:
                    code += '        result = '
                    code += ' + '.join([f'request.{p["name"]}' for p in in_params])
                    code += '\n'
            else:
                code += '        result = 0  # Implementar lógica aquí\n'
            
            code += f'        return service_pb2.{proc_name}Response(result=result)\n\n'
        
        code += 'def serve():\n'
        code += '    """Iniciar servidor gRPC"""\n'
        code += '    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))\n'
        code += '    service_pb2_grpc.add_RemoteProcedureServiceServicer_to_server(\n'
        code += '        RemoteProcedureServicer(), server)\n'
        code += f'    server.add_insecure_port("[::]:50051")  # Transporte: {transport.upper()}\n'
        code += '    server.start()\n'
        code += '    print("Servidor gRPC iniciado en puerto 50051...")\n'
        code += '    server.wait_for_termination()\n\n'
        code += 'if __name__ == "__main__":\n'
        code += '    serve()\n'
        
        return code
    
    def _generate_grpc_client(self, procedures, transport):
        """Generar cliente Python para gRPC"""
        code = '#!/usr/bin/env python\n'
        code += '# -*- coding: utf-8 -*-\n'
        code += f'# Generado automáticamente el {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n\n'
        code += 'import grpc\n'
        code += 'import service_pb2\n'
        code += 'import service_pb2_grpc\n\n'
        
        code += 'def run():\n'
        code += '    """Cliente gRPC para probar procedimientos remotos"""\n'
        code += f'    # Transporte: {transport.upper()}\n'
        code += '    with grpc.insecure_channel("localhost:50051") as channel:\n'
        code += '        stub = service_pb2_grpc.RemoteProcedureServiceStub(channel)\n\n'
        
        # Ejemplos para cada procedimiento
        for proc in procedures:
            proc_name = self._capitalize(proc['name'])
            code += f'        # Ejemplo: {proc["name"]}\n'
            in_params = [p for p in proc['parameters'] if p['direction'] == 'in']
            
            if in_params:
                params_str = ', '.join([f'{p["name"]}={self._get_example_value(p["type"])}' 
                                       for p in in_params])
                code += f'        request = service_pb2.{proc_name}Request({params_str})\n'
                code += f'        response = stub.{proc_name}(request)\n'
                code += f'        print(f"Resultado de {proc["name"]}: {{response.result}}")\n\n'
        
        code += 'if __name__ == "__main__":\n'
        code += '    run()\n'
        
        return code
    
    # ==================== RMI ====================
    def generate_rmi(self, procedures, transport):
        """Generar archivos Java para RMI"""
        interface_code = self._generate_rmi_interface(procedures, transport)
        server_code = self._generate_rmi_server(procedures, transport)
        client_code = self._generate_rmi_client(procedures, transport)
        
        # Guardar archivos
        interface_path = os.path.join(self.base_path, 'rmi', 'RemoteProcedureService.java')
        server_path = os.path.join(self.base_path, 'rmi', 'RemoteProcedureServer.java')
        client_path = os.path.join(self.base_path, 'rmi', 'RemoteProcedureClient.java')
        
        with open(interface_path, 'w') as f:
            f.write(interface_code)
        with open(server_path, 'w') as f:
            f.write(server_code)
        with open(client_path, 'w') as f:
            f.write(client_code)
        
        return {
            'interface': interface_code,
            'server': server_code,
            'client': client_code,
            'files': {
                'RemoteProcedureService.java': interface_path,
                'RemoteProcedureServer.java': server_path,
                'RemoteProcedureClient.java': client_path
            }
        }
    
    def _generate_rmi_interface(self, procedures, transport):
        """Generar interfaz Java para RMI"""
        code = f'// Generado automáticamente el {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n'
        code += f'// Transporte: {transport.upper()}\n\n'
        code += 'import java.rmi.Remote;\n'
        code += 'import java.rmi.RemoteException;\n\n'
        code += 'public interface RemoteProcedureService extends Remote {\n\n'
        
        for proc in procedures:
            code += f'    /**\n'
            code += f'     * {proc.get("description", "Procedimiento remoto")}\n'
            in_params = [p for p in proc['parameters'] if p['direction'] == 'in']
            for param in in_params:
                code += f'     * @param {param["name"]} Parámetro de entrada tipo {param["type"]}\n'
            code += f'     * @return Resultado tipo {proc["returnType"]}\n'
            code += '     * @throws RemoteException Si ocurre un error en la comunicación remota\n'
            code += '     */\n'
            
            java_return = self._map_type_to_java(proc['returnType'])
            params_str = ', '.join([f'{self._map_type_to_java(p["type"])} {p["name"]}' 
                                   for p in in_params])
            code += f'    {java_return} {proc["name"]}({params_str}) throws RemoteException;\n\n'
        
        code += '}\n'
        return code
    
    def _generate_rmi_server(self, procedures, transport):
        """Generar servidor Java para RMI"""
        code = f'// Generado automáticamente el {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n'
        code += f'// Transporte: {transport.upper()}\n\n'
        code += 'import java.rmi.RemoteException;\n'
        code += 'import java.rmi.registry.LocateRegistry;\n'
        code += 'import java.rmi.registry.Registry;\n'
        code += 'import java.rmi.server.UnicastRemoteObject;\n\n'
        code += 'public class RemoteProcedureServer extends UnicastRemoteObject implements RemoteProcedureService {\n\n'
        code += '    protected RemoteProcedureServer() throws RemoteException {\n'
        code += '        super();\n'
        code += '    }\n\n'
        
        # Implementar métodos
        for proc in procedures:
            in_params = [p for p in proc['parameters'] if p['direction'] == 'in']
            java_return = self._map_type_to_java(proc['returnType'])
            params_str = ', '.join([f'{self._map_type_to_java(p["type"])} {p["name"]}' 
                                   for p in in_params])
            
            code += '    @Override\n'
            code += f'    public {java_return} {proc["name"]}({params_str}) throws RemoteException {{\n'
            code += f'        // TODO: Implementar lógica de {proc["name"]}\n'
            
            # Soporta 'sum' además de 'suma/sumar/add'
            if proc['name'] in ['suma', 'sumar', 'add', 'sum'] and in_params:
                code += '        return ' + ' + '.join([p["name"] for p in in_params]) + ';\n'
            elif proc['returnType'] != 'void':
                code += f'        return {self._get_java_default(proc["returnType"])};\n'
            
            code += '    }\n\n'
        
        code += '    public static void main(String[] args) {\n'
        code += '        try {\n'
        code += '            RemoteProcedureServer server = new RemoteProcedureServer();\n'
        code += '            Registry registry = LocateRegistry.createRegistry(1099);\n'
        code += '            registry.rebind("RemoteProcedureService", server);\n'
        code += '            System.out.println("Servidor RMI iniciado en puerto 1099...");\n'
        code += '        } catch (Exception e) {\n'
        code += '            e.printStackTrace();\n'
        code += '        }\n'
        code += '    }\n'
        code += '}\n'
        
        return code
    
    def _generate_rmi_client(self, procedures, transport):
        """Generar cliente Java para RMI"""
        code = f'// Generado automáticamente el {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n'
        code += f'// Transporte: {transport.upper()}\n\n'
        code += 'import java.rmi.registry.LocateRegistry;\n'
        code += 'import java.rmi.registry.Registry;\n\n'
        code += 'public class RemoteProcedureClient {\n\n'
        code += '    public static void main(String[] args) {\n'
        code += '        try {\n'
        code += '            Registry registry = LocateRegistry.getRegistry("localhost", 1099);\n'
        code += '            RemoteProcedureService service = (RemoteProcedureService) registry.lookup("RemoteProcedureService");\n\n'
        
        # Ejemplos para cada procedimiento
        for proc in procedures:
            in_params = [p for p in proc['parameters'] if p['direction'] == 'in']
            code += f'            // Ejemplo: {proc["name"]}\n'
            
            if in_params:
                args_str = ', '.join([self._get_example_value_java(p['type']) for p in in_params])
                if proc['returnType'] != 'void':
                    java_return = self._map_type_to_java(proc['returnType'])
                    code += f'            {java_return} result{proc["name"]} = service.{proc["name"]}({args_str});\n'
                    code += f'            System.out.println("Resultado de {proc["name"]}: " + result{proc["name"]});\n\n'
                else:
                    code += f'            service.{proc["name"]}({args_str});\n\n'
        
        code += '        } catch (Exception e) {\n'
        code += '            e.printStackTrace();\n'
        code += '        }\n'
        code += '    }\n'
        code += '}\n'
        
        return code
    
    # ==================== .NET Remoting ====================
    def generate_netremoting(self, procedures, transport):
        """Generar archivos C# para .NET Remoting"""
        interface_code = self._generate_netremoting_interface(procedures, transport)
        server_code = self._generate_netremoting_server(procedures, transport)
        client_code = self._generate_netremoting_client(procedures, transport)
        
        # Guardar archivos
        interface_path = os.path.join(self.base_path, 'netremoting', 'IRemoteProcedureService.cs')
        server_path = os.path.join(self.base_path, 'netremoting', 'RemoteProcedureServer.cs')
        client_path = os.path.join(self.base_path, 'netremoting', 'RemoteProcedureClient.cs')
        
        with open(interface_path, 'w') as f:
            f.write(interface_code)
        with open(server_path, 'w') as f:
            f.write(server_code)
        with open(client_path, 'w') as f:
            f.write(client_code)
        
        return {
            'interface': interface_code,
            'server': server_code,
            'client': client_code,
            'files': {
                'IRemoteProcedureService.cs': interface_path,
                'RemoteProcedureServer.cs': server_path,
                'RemoteProcedureClient.cs': client_path
            }
        }
    
    def _generate_netremoting_interface(self, procedures, transport):
        """Generar interfaz C# para .NET Remoting"""
        code = f'// Generado automáticamente el {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n'
        code += f'// Transporte: {transport.upper()}\n\n'
        code += 'using System;\n\n'
        code += 'namespace RemoteProcedures\n{\n'
        code += '    public interface IRemoteProcedureService\n'
        code += '    {\n'
        
        for proc in procedures:
            in_params = [p for p in proc['parameters'] if p['direction'] == 'in']
            code += f'        /// <summary>\n'
            code += f'        /// {proc.get("description", "Procedimiento remoto")}\n'
            code += '        /// </summary>\n'
            
            csharp_return = self._map_type_to_csharp(proc['returnType'])
            params_str = ', '.join([f'{self._map_type_to_csharp(p["type"])} {p["name"]}' 
                                   for p in in_params])
            proc_name = self._capitalize(proc['name'])
            code += f'        {csharp_return} {proc_name}({params_str});\n\n'
        
        code += '    }\n'
        code += '}\n'
        
        return code
    
    def _generate_netremoting_server(self, procedures, transport):
        """Generar servidor C# para .NET Remoting"""
        code = f'// Generado automáticamente el {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n'
        code += f'// Transporte: {transport.upper()}\n\n'
        code += 'using System;\n'
        code += 'using System.Runtime.Remoting;\n'
        code += 'using System.Runtime.Remoting.Channels;\n'
        code += 'using System.Runtime.Remoting.Channels.Tcp;\n\n'
        code += 'namespace RemoteProcedures\n{\n'
        code += '    public class RemoteProcedureService : MarshalByRefObject, IRemoteProcedureService\n'
        code += '    {\n'
        
        # Implementar métodos
        for proc in procedures:
            in_params = [p for p in proc['parameters'] if p['direction'] == 'in']
            csharp_return = self._map_type_to_csharp(proc['returnType'])
            params_str = ', '.join([f'{self._map_type_to_csharp(p["type"])} {p["name"]}' 
                                   for p in in_params])
            proc_name = self._capitalize(proc['name'])
            
            code += f'        public {csharp_return} {proc_name}({params_str})\n'
            code += '        {\n'
            code += f'            // TODO: Implementar lógica de {proc["name"]}\n'
            
            # Añadir 'sum' a los alias reconocidos al generar código C#
            if proc['name'] in ['suma', 'sumar', 'add', 'sum'] and in_params:
                code += '            return ' + ' + '.join([p["name"] for p in in_params]) + ';\n'
            elif proc['returnType'] != 'void':
                code += f'            return {self._get_csharp_default(proc["returnType"])};\n'
            
            code += '        }\n\n'
        
        code += '    }\n\n'
        code += '    class Program\n'
        code += '    {\n'
        code += '        static void Main(string[] args)\n'
        code += '        {\n'
        code += '            TcpChannel channel = new TcpChannel(8085);\n'
        code += '            ChannelServices.RegisterChannel(channel, false);\n'
        code += '            RemotingConfiguration.RegisterWellKnownServiceType(\n'
        code += '                typeof(RemoteProcedureService),\n'
        code += '                "RemoteProcedureService",\n'
        code += '                WellKnownObjectMode.Singleton);\n'
        code += '            Console.WriteLine("Servidor .NET Remoting iniciado en puerto 8085...");\n'
        code += '            Console.ReadLine();\n'
        code += '        }\n'
        code += '    }\n'
        code += '}\n'
        
        return code
    
    def _generate_netremoting_client(self, procedures, transport):
        """Generar cliente C# para .NET Remoting"""
        code = f'// Generado automáticamente el {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n'
        code += f'// Transporte: {transport.upper()}\n\n'
        code += 'using System;\n'
        code += 'using System.Runtime.Remoting.Channels;\n'
        code += 'using System.Runtime.Remoting.Channels.Tcp;\n\n'
        code += 'namespace RemoteProcedures\n{\n'
        code += '    class Client\n'
        code += '    {\n'
        code += '        static void Main(string[] args)\n'
        code += '        {\n'
        code += '            TcpChannel channel = new TcpChannel();\n'
        code += '            ChannelServices.RegisterChannel(channel, false);\n'
        code += '            IRemoteProcedureService service = (IRemoteProcedureService)Activator.GetObject(\n'
        code += '                typeof(IRemoteProcedureService),\n'
        code += '                "tcp://localhost:8085/RemoteProcedureService");\n\n'
        
        # Ejemplos para cada procedimiento
        for proc in procedures:
            in_params = [p for p in proc['parameters'] if p['direction'] == 'in']
            proc_name = self._capitalize(proc['name'])
            code += f'            // Ejemplo: {proc["name"]}\n'
            
            if in_params:
                args_str = ', '.join([self._get_example_value_csharp(p['type']) for p in in_params])
                if proc['returnType'] != 'void':
                    csharp_return = self._map_type_to_csharp(proc['returnType'])
                    code += f'            {csharp_return} result{proc_name} = service.{proc_name}({args_str});\n'
                    code += f'            Console.WriteLine($"Resultado de {proc["name"]}: {{result{proc_name}}}");\n\n'
                else:
                    code += f'            service.{proc_name}({args_str});\n\n'
        
        code += '            Console.ReadLine();\n'
        code += '        }\n'
        code += '    }\n'
        code += '}\n'
        
        return code
    
    # ==================== Utilidades ====================
    def _capitalize(self, text):
        return text[0].upper() + text[1:] if text else text
    
    def _map_type_to_proto(self, type_name):
        mapping = {
            'string': 'string',
            'int': 'int32',
            'float': 'float',
            'boolean': 'bool',
            'double': 'double',
            'long': 'int64',
            'byte[]': 'bytes'
        }
        return mapping.get(type_name, 'string')
    
    def _map_type_to_java(self, type_name):
        mapping = {
            'string': 'String',
            'int': 'int',
            'float': 'float',
            'boolean': 'boolean',
            'double': 'double',
            'long': 'long',
            'byte[]': 'byte[]',
            'void': 'void'
        }
        return mapping.get(type_name, 'Object')
    
    def _map_type_to_csharp(self, type_name):
        mapping = {
            'string': 'string',
            'int': 'int',
            'float': 'float',
            'boolean': 'bool',
            'double': 'double',
            'long': 'long',
            'byte[]': 'byte[]',
            'void': 'void'
        }
        return mapping.get(type_name, 'object')
    
    def _get_example_value(self, type_name):
        examples = {
            'string': '"ejemplo"',
            'int': '10',
            'float': '3.14',
            'boolean': 'True',
            'double': '2.71828',
            'long': '1000000',
            'byte[]': 'b"data"'
        }
        return examples.get(type_name, '0')
    
    def _get_example_value_java(self, type_name):
        examples = {
            'string': '"ejemplo"',
            'int': '10',
            'float': '3.14f',
            'boolean': 'true',
            'double': '2.71828',
            'long': '1000000L',
            'byte[]': 'new byte[]{1, 2, 3}'
        }
        return examples.get(type_name, '0')
    
    def _get_example_value_csharp(self, type_name):
        examples = {
            'string': '"ejemplo"',
            'int': '10',
            'float': '3.14f',
            'boolean': 'true',
            'double': '2.71828',
            'long': '1000000L',
            'byte[]': 'new byte[]{1, 2, 3}'
        }
        return examples.get(type_name, '0')
    
    def _get_java_default(self, type_name):
        defaults = {
            'int': '0',
            'float': '0.0f',
            'boolean': 'false',
            'double': '0.0',
            'long': '0L',
            'string': '""'
        }
        return defaults.get(type_name, 'null')
    
    def _get_csharp_default(self, type_name):
        defaults = {
            'int': '0',
            'float': '0.0f',
            'bool': 'false',
            'double': '0.0',
            'long': '0L',
            'string': '""'
        }
        return defaults.get(type_name, 'null')