#!/bin/bash
set -e

echo "🚀 Déploiement TierTogether"
echo "=========================="

# Vérifier que .env.production existe
if [ ! -f .env.production ]; then
  echo "❌ Fichier .env.production manquant !"
  exit 1
fi

# Charger les variables (ligne par ligne pour gérer les valeurs avec caractères spéciaux)
while IFS='=' read -r key value; do
  [[ -z "$key" || "$key" == \#* ]] && continue
  export "$key=$value"
done < .env.production

if [ "$JWT_SECRET" = "CHANGE_ME" ]; then
  echo "❌ Change le JWT_SECRET dans .env.production !"
  exit 1
fi

# Copier .env.production comme .env pour docker-compose
cp .env.production .env

# Build et lancer
echo "📦 Build des containers..."
docker compose build --no-cache

echo "🔄 Lancement des services..."
docker compose up -d

echo ""
echo "✅ TierTogether est lancé !"
echo "   → http://$DOMAIN (HTTP)"
echo ""
echo "📌 Prochaine étape : SSL"
echo "   docker compose run --rm certbot certonly --webroot -w /var/lib/letsencrypt -d $DOMAIN"
echo "   Puis décommente le bloc HTTPS dans nginx.conf et relance :"
echo "   docker compose restart nginx"
