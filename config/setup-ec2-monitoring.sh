#!/usr/bin/env bash
set -e

echo "=== Instalando Agente de Monitoreo OpenTelemetry Collector en Ubuntu EC2 ==="

OTEL_VERSION="0.95.0"
DEB_FILE="otelcol-contrib_${OTEL_VERSION}_linux_amd64.deb"

if ! command -v otelcol-contrib &> /dev/null; then
    echo "Descargando paquete otelcol-contrib v${OTEL_VERSION}..."
    wget -q "https://github.com/open-telemetry/opentelemetry-collector-releases/releases/download/v${OTEL_VERSION}/${DEB_FILE}"
    sudo dpkg -i "${DEB_FILE}"
    rm -f "${DEB_FILE}"
fi

echo "Copiando archivo de configuracion..."
sudo mkdir -p /etc/otelcol-contrib
sudo cp ./config/otel-collector-ec2.yaml /etc/otelcol-contrib/config.yaml

echo "Configurando variables de entorno de systemd..."
sudo mkdir -p /etc/systemd/system/otelcol-contrib.service.d/
cat <<EOF | sudo tee /etc/systemd/system/otelcol-contrib.service.d/override.conf
[Service]
Environment="OPENOBSERVE_ENDPOINT=${OPENOBSERVE_ENDPOINT:-http://localhost:5080/api/default}"
Environment="OPENOBSERVE_AUTH_TOKEN=${OPENOBSERVE_AUTH_TOKEN:-Basic root@example.com:password_base64}"
EOF

echo "Reiniciando servicio otelcol-contrib..."
sudo systemctl daemon-reload
sudo systemctl enable otelcol-contrib
sudo systemctl restart otelcol-contrib

echo "=== Instalacion completada exitosamente. El agente esta reportando CPU, RAM, Red y Disco a OpenObserve. ==="
