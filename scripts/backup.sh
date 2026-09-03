#!/bin/bash
export TZ="America/Sao_Paulo"
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

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
if docker exec cozinha-db pg_dump -U postgres -d cozinha | gzip > "$FILE_PATH"; then
    # Verifica se o backup tem mais que o tamanho mínimo de um gzip vazio (aprox 20 bytes)
    FILE_SIZE=$(stat -c%s "$FILE_PATH" 2>/dev/null || echo 0)
    
    if [ "$FILE_SIZE" -gt 100 ]; then
        echo "Backup gerado com sucesso: $FILE_PATH ($FILE_SIZE bytes)"
        
        # Envia o arquivo pro Telegram
        curl -s -F chat_id="$CHAT_ID" -F document=@"$FILE_PATH" -F caption="✅ Backup Automático - Cozinha+ ($(date +"%d/%m/%Y %H:%M"))" "https://api.telegram.org/bot$BOT_TOKEN/sendDocument"
        
        # Apaga arquivos mais antigos que 7 dias para economizar espaço
        find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +7 -exec rm {} \;
        echo "Limpeza de backups antigos concluída."
    else
        echo "Erro: O backup gerado está vazio ou corrompido!"
        rm -f "$FILE_PATH"
        curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
            -d chat_id="$CHAT_ID" \
            -d text="❌ ERRO CRÍTICO: O arquivo de backup do banco de dados Cozinha+ gerado em $(date +"%d/%m/%Y %H:%M") está vazio."
    fi
else
    echo "Erro ao executar o comando de dump do banco de dados!"
    curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
        -d chat_id="$CHAT_ID" \
        -d text="❌ ERRO CRÍTICO: Falha na comunicação com o banco de dados para gerar o backup Cozinha+ em $(date +"%d/%m/%Y %H:%M")."
fi
