# Para crear el contenedor
```bash
docker-compose build ci_nginx ci_php ci_mysql
```

# Para arrancar el contenedor
```bash
docker-compose up ci_nginx ci_php ci_mysql
```

# Para detener el contenedor
```bash
docker stop ci_nginx ci_php ci_mysql
```

# Para eliminar el contenedor
```bash
docker rm ci_nginx ci_php ci_mysql
```

# Para reiniciar los contenedores
```bash
docker restart ci_nginx ci_php ci_mysql
```