#!/bin/bash
export TZ="America/Sao_Paulo"
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

BOT_TOKEN="8261444082:AAE8hXDWocLrcO6pzLEIq2PA9EE8MwgbqHI"
CHAT_ID="1045658856"
DATE=$(date +"%d/%m/%Y %H:%M")

# Verify if backend container is running
BACKEND_STATUS=$(docker inspect -f '{{.State.Status}}' cozinha-backend 2>/dev/null || echo "offline")

if [ "$BACKEND_STATUS" != "running" ]; then
    MESSAGE="🆘 *ALERTA CRÍTICO DE QUEDA (UPTIME)* 🆘
📅 $DATE

O sistema Cozinha+ (*Backend*) parou de responder ou o container caiu.
Status Atual: \`$BACKEND_STATUS\`

Ação Imediata Necessária na VPS!"

    curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
        -d chat_id="$CHAT_ID" \
        -d parse_mode="Markdown" \
        -d text="$MESSAGE"
        
    # Evita flodar o telegram a cada minuto, criando um arquivo de lock
    touch /tmp/cozinha_offline.lock
else
    # Se estava offline e voltou, envia mensagem de recuperação
    if [ -f /tmp/cozinha_offline.lock ]; then
        MESSAGE="✅ *SISTEMA RESTABELECIDO* ✅
📅 $DATE

O sistema Cozinha+ voltou a ficar online e operante."

        curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
            -d chat_id="$CHAT_ID" \
            -d parse_mode="Markdown" \
            -d text="$MESSAGE"
            
        rm /tmp/cozinha_offline.lock
    fi
fi
