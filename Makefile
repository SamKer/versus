deploy:
  cd frontend/
  quasar build
  cd ../
  dc exec docs mkdocs build
  rsync -ar server/ toky:/home/ryuken/versus/server
