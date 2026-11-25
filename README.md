# Proyecto Parcial 2: Arquitectura CI/CD, Pruebas Automatizadas y Observabilidad

Este proyecto implementa una solución integral de entrega continua (CI/CD) en GitHub Actions, suite de pruebas automatizadas E2E con Playwright, e instrumentación completa de observabilidad utilizando **OpenTelemetry (OTLP)** exportando hacia **OpenObserve**, junto con monitoreo de infraestructura para servidores AWS EC2.

---

## 🛠️ Requerimientos Cumplidos

1. **Observabilidad (OpenTelemetry -> OpenObserve):**
   - **Logs estructurados:** Contexto de trazabilidad (`trace_id`, `span_id`), operaciones y manejo de excepciones no controladas.
   - **Métricas aplicativas:** Tiempos de respuesta / latencia (`http_request_duration_seconds`), peticiones por segundo (`http_requests_total`) y tasa de errores HTTP por endpoint y statusCode (`http_errors_total`).
   - **Trazas distribuidas (Traces):** Rastreo de peticiones HTTP y operaciones a la base de datos simulada.
2. **Suite de Pruebas con Playwright:**
   - Cobertura E2E de flujos exitosos y manejo de excepciones HTTP 500.
   - Mecanismo configurable de **fallo intencional** vía variable de entorno `FAIL_PIPELINE=true`.
3. **Pipeline de CI/CD en GitHub Actions (`.github/workflows/main.yml`):**
   - **Job 1 (Pruebas y Auditoría):** Ejecuta Playwright, envía auditoría JSON a OpenObserve con resultado (`commit_sha`, rama, autor). Si falla, cancela el pipeline y bloquea la conexión SSH a EC2.
   - **Job 2 (Construcción y Despliegue):** Condicionado al éxito de Job 1. Construye imagen Docker, la etiqueta como `:latest` y `:commit_sha`, se autentica mediante PAT en Docker Hub, despliega vía SSH en AWS EC2 y transmite confirmación a OpenObserve.
4. **Monitor de Infraestructura AWS EC2:**
   - Agente `otelcol-contrib` en Ubuntu Server recolectando métricas de CPU, Memoria RAM, Ancho de Banda y Almacenamiento hacia OpenObserve.

---

## 🚀 Guía de Ejecución Local

### 1. Instalación de Dependencias
```bash
npm install
npx playwright install --with-deps chromium
```

### 2. Variables de Entorno
Copia el archivo `.env.example` a `.env` y configura los valores correspondientes:
```bash
cp .env.example .env
```

### 3. Iniciar Backend con Instrumentación OpenTelemetry
```bash
npm start
```
El servidor iniciará en `http://localhost:3000` y transmitirá telemetría OTLP al endpoint configurado en OpenObserve.

### 4. Ejecutar Suite de Pruebas E2E (Playwright)
```bash
# Modo normal (Éxito esperado)
npm run test:e2e

# Modo de simulación de fallo intencional para verificar bloqueo del pipeline
FAIL_PIPELINE=true npm run test:e2e
```

---

## 🔑 Configuración de GitHub Secrets

Para habilitar la ejecución completa del pipeline en GitHub Actions, configura las siguientes claves en **Settings > Secrets and variables > Actions**:

| Secret Name | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `OPENOBSERVE_URL` | URL base del servidor OpenObserve | `http://openobserve.tu-dominio.com:5080` |
| `OPENOBSERVE_ORG` | Organización de OpenObserve | `default` |
| `OPENOBSERVE_STREAM` | Nombre del stream de logs para auditoría | `cicd_audit` |
| `OPENOBSERVE_AUTH_TOKEN` | Token HTTP Basic Auth de OpenObserve | `Basic root@example.com:password_base64` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Endpoint ingestion OTLP HTTP de OpenObserve | `http://openobserve.tu-dominio.com:5080/api/default` |
| `DOCKER_HUB_USERNAME` | Usuario de Docker Hub | `miusuario` |
| `DOCKER_HUB_PAT` | Personal Access Token (PAT) de Docker Hub | `dckr_pat_xxxxxxx` |
| `DOCKER_IMAGE_NAME` | Nombre del repositorio de imagen | `proyecto-parcial2-app` |
| `EC2_HOST` | Dominio o IP pública de la instancia AWS EC2 | `ec2-xx-xx-xx-xx.compute-1.amazonaws.com` |
| `EC2_USER` | Usuario SSH de la instancia Ubuntu | `ubuntu` |
| `EC2_SSH_KEY` | Clave privada SSH sin contraseña | `-----BEGIN OPENSSH PRIVATE KEY----- ...` |

---

## 🖥️ Agente de Monitoreo de Infraestructura en AWS EC2

Para instalar y activar el agente de OpenTelemetry Collector en tu servidor Ubuntu EC2:

1. Clona o copia los archivos de la carpeta `config/` en la instancia EC2.
2. Ejecuta el script de instalación:
```bash
export OPENOBSERVE_ENDPOINT="http://openobserve.tu-dominio.com:5080/api/default"
export OPENOBSERVE_AUTH_TOKEN="Basic root@example.com:password_base64"
chmod +x ./config/setup-ec2-monitoring.sh
./config/setup-ec2-monitoring.sh
```
3. Verifica el servicio en Ubuntu:
```bash
sudo systemctl status otelcol-contrib
```
El agente transmitirá automáticamente el consumo de CPU, Memoria RAM, Red y Disco a OpenObserve.
