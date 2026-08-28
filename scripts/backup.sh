#!/bin/bash

# Configurações do Telegram
BOT_TOKEN="8261444082:AAE8hXDWocLrcO6pzLEIq2PA9EE8MwgbqHI"
CHAT_ID="1045658856"

# Configurações do Backup
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +"%Y-%m-%d_%H-%M")
FILE_NAME="cozinha_db_$DATE.sql.gz"
FILE_PATH="$BACKUP_DIR/$FILE_NAME"

# Cria a pasta de backups se não existir
mkdir -p $BACKUP_DIR

# Executa o dump do banco de dados direto do container e compacta
echo "Iniciando backup do banco de dados..."
docker exec cozinha-db pg_dump -U postgres -d cozinha | gzip > $FILE_PATH

# Verifica se o backup foi gerado com sucesso
if [ -f "$FILE_PATH" ]; then
    echo "Backup gerado com sucesso: $FILE_PATH"
    
    # Envia o arquivo pro Telegram
    curl -F chat_id="$CHAT_ID" -F document=@"$FILE_PATH" -F caption="✅ Backup Automático - Cozinha+ ($DATE)" "https://api.telegram.org/bot$BOT_TOKEN/sendDocument"
    
    # Apaga arquivos mais antigos que 7 dias para economizar espaço (mantém os limites do Free Tier)
    find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +7 -exec rm {} \;
    echo "Limpeza de backups antigos concluída."
else
    echo "Erro ao gerar o backup!"
    curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
        -d chat_id="$CHAT_ID" \
        -d text="❌ ERRO CRÍTICO: Falha ao gerar o backup do banco de dados Cozinha+ em $DATE"
fi
