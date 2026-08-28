#!/bin/bash

BOT_TOKEN="8261444082:AAE8hXDWocLrcO6pzLEIq2PA9EE8MwgbqHI"
CHAT_ID="1045658856"
DATE=$(date +"%d/%m/%Y %H:%M")

# Coletar uso de CPU
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')

# Coletar uso de RAM
RAM_TOTAL=$(free -m | awk 'NR==2{print $2}')
RAM_USED=$(free -m | awk 'NR==2{print $3}')
RAM_PERCENT=$(free -m | awk 'NR==2{printf "%.2f", $3*100/$2 }')

# Coletar uso de Disco
DISK_USAGE=$(df -h / | awk '$NF=="/"{printf "%s", $5}')

# Coletar status dos containers principais
BACKEND_STATUS=$(docker inspect -f '{{.State.Status}}' cozinha-backend 2>/dev/null || echo "offline")
FRONTEND_STATUS=$(docker inspect -f '{{.State.Status}}' cozinha-frontend 2>/dev/null || echo "offline")
DB_STATUS=$(docker inspect -f '{{.State.Status}}' cozinha-db 2>/dev/null || echo "offline")

# Construir a mensagem formatada
MESSAGE="📊 *Relatório Diário VPS Cozinha+*
📅 $DATE

🖥 *Recursos:*
• CPU: ${CPU_USAGE}%
• RAM: ${RAM_USED}MB / ${RAM_TOTAL}MB (${RAM_PERCENT}%)
• Disco: ${DISK_USAGE} de 200GB

🐳 *Status dos Serviços:*
• Backend: \`$BACKEND_STATUS\`
• Frontend: \`$FRONTEND_STATUS\`
• Database: \`$DB_STATUS\`"

# Se o backend não estiver rodando perfeitamente, anexa as últimas 10 linhas de log
if [ "$BACKEND_STATUS" != "running" ]; then
    ERROR_LOGS=$(docker logs --tail 10 cozinha-backend 2>&1)
    MESSAGE="$MESSAGE

⚠️ *Alerta: Backend pode estar com problemas!*
*Últimos Logs:*
\`\`\`
$ERROR_LOGS
\`\`\`"
fi

# Envia para o Telegram
curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
    -d chat_id="$CHAT_ID" \
    -d parse_mode="Markdown" \
    -d text="$MESSAGE"
