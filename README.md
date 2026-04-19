# Versus (versus)

all fight look like street fighter

## Install the dependencies
```bash
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)
```bash
quasar dev
```

### Lint the files
```bash
npm run lint
```

### Build the app for production
```bash
quasar build
```

### Customize the configuration
See [Configuring quasar.conf.js](https://quasar.dev/quasar-cli/quasar-conf-js).

## Enregistrer les sons de la vidéo compilée

Les sons (READY / FIGHT / KO / DRAW) sont des fichiers WAV dans `data/sounds/`.
Pour les remplacer par ta voix, enregistre-les avec `arecord` (3 secondes, parle dès le lancement) :

```bash
# READY
arecord -f cd -r 44100 -c 1 -d 3 -t wav /tmp/ready_v2.wav
sudo cp /tmp/ready_v2.wav /home/sam/www/samker/versus/data/sounds/ready_v2.wav

# FIGHT
arecord -f cd -r 44100 -c 1 -d 3 -t wav /tmp/fight_v2.wav
sudo cp /tmp/fight_v2.wav /home/sam/www/samker/versus/data/sounds/fight_v2.wav

# KO
arecord -f cd -r 44100 -c 1 -d 3 -t wav /tmp/ko_v2.wav
sudo cp /tmp/ko_v2.wav /home/sam/www/samker/versus/data/sounds/ko_v2.wav

# DRAW
arecord -f cd -r 44100 -c 1 -d 3 -t wav /tmp/draw_v2.wav
sudo cp /tmp/draw_v2.wav /home/sam/www/samker/versus/data/sounds/draw_v2.wav
```

> Change `-d 3` en `-d 5` si tu veux plus de temps.
> Les fichiers sont globaux (partagés par tous les projets).
