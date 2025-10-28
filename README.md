## Sistema remoto

Repositorio para la aplicación "sistema-remoto" (frontend React + backend Flask). Este README se centra en cómo poner en marcha y usar el backend incluido en `backend/`.
## sistema-remoto — guía del proyecto

Este repositorio contiene una aplicación con frontend (React + Vite) y backend (Flask). A continuación tienes una guía completa para entender la estructura, ejecutar el proyecto en desarrollo y usar los endpoints del backend.

## Resumen rápido

- Frontend: React + Vite (carpeta `src/`, punto de entrada `main.jsx`).
- Backend: Flask + Flask-SocketIO (carpeta `backend/`).
- Código generado: `backend/generated/` (gRPC/RMI/.NET examples).

## Estructura principal

Raíz del repo (lo más relevante):

- `src/` — código React (componentes, estilos, assets).
- `public/`, `index.html` — archivos estáticos.
- `backend/` — API y servicios en Python.
	- `app.py` — servidor Flask con endpoints REST y websocket.
	- `requirements.txt` — dependencias Python.
	- `services/` — lógica del proyecto (ejecutor, generador de código, etc.).
	- `generated/` — salida de código generado (protos, servidores, clientes).
- `package.json`, `vite.config.js` — configuración del frontend.

## Prerrequisitos

- Python 3.10+ (para el backend).
- Node.js 16+ y npm/yarn (para el frontend).

## Ejecutar en desarrollo

1) Backend (Windows — cmd.exe)

```bat
cd sistema-remoto\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

El backend escucha por defecto en `0.0.0.0:8080`.

2) Frontend (desde la raíz del repo)

```bat
cd c:\Users\vfcob\Downloads\progra-distrib\progra-distrib\sistema-remoto
npm install
npm run dev
```

Vite suele levantar el servidor en `http://localhost:5173` (o puerto disponible). El frontend hace llamadas al backend en `http://localhost:8080`.

## Endpoints del backend

- POST /api/procedures
	- Registra procedimientos y genera código de ejemplo.
	- Body JSON ejemplo:

```json
{
	"protocol": "grpc",
	"transport": "tcp",
	"procedures": [
		{
			"name": "add",
			"description": "Suma",
			"returnType": "int",
			"parameters": [
				{"name": "a", "type": "int", "direction": "in"},
				{"name": "b", "type": "int", "direction": "in"}
			]
		}
	]
}
```

- POST /api/execute
	- Ejecuta un procedimiento registrado.
	- Body JSON ejemplo:

```json
{ "procedureName": "sum", "parameters": { "a": 3, "b": 4 } }
```

- GET /api/preview/code?protocol=grpc&type=proto — ver `service.proto` generado.
- GET /api/download/code?protocol=grpc — descargar ZIP con código generado.

## Registro y normalización de nombres

Para evitar errores por mayúsculas o alias, el backend normaliza `proc['name']` a minúsculas al registrar y resuelve sinónimos comunes en tiempo de ejecución (por ejemplo, `sum`, `add`, `suma`, `sumar`). Esto mejora la tolerancia a variaciones en llamadas desde el frontend o desde cURL.

Los cambios recientes relacionados:

- `backend/services/executor.py`: normalización y método `_find_registered_name` para resolver aliases.
- `backend/services/code_generator.py`: inclusión de `sum` en los alias usados por plantillas.

## Desarrollo y pruebas

- Recomendado: ejecutar backend y frontend en terminales separadas (activar el virtualenv en backend).
- Pruebas rápidas con curl (desde cmd.exe):

Registrar procedimiento:

```bat
curl -X POST -H "Content-Type: application/json" -d "{\"protocol\":\"grpc\",\"transport\":\"tcp\",\"procedures\":[{\"name\":\"add\",\"description\":\"Suma\",\"returnType\":\"int\",\"parameters\":[{\"name\":\"a\",\"type\":\"int\",\"direction\":\"in\"},{\"name\":\"b\",\"type\":\"int\",\"direction\":\"in\"}]}]}" http://localhost:8080/api/procedures
```

Ejecutar procedimiento:

```bat
curl -X POST -H "Content-Type: application/json" -d "{\"procedureName\":\"sum\",\"parameters\":{\"a\":3,\"b\":4}}" http://localhost:8080/api/execute
```

## Generación de código

El generador produce ejemplos para varios protocolos y guarda los archivos en `backend/generated/{grpc|rmi|netremoting}`. Usa `services/code_generator.py`.

## Problemas comunes y soluciones

- Error "Procedimiento \"sum\" no encontrado": asegúrate de haber registrado el procedimiento (POST `/api/procedures`) o usa `procedureName` en minúsculas; el backend ahora resuelve `sum` a `add`/`suma` cuando sea posible.
- Errores de dependencias Python: activa el virtualenv y reinstala con `pip install -r requirements.txt`.

---

README actualizado el: 2025-10-27
