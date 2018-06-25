# Redoc docker image

## Build

    docker build -t redoc .

## Usage

Serve remote spec by URL:

    docker run -it --rm -p 80:80 \
      -e SPEC_URL='http://localhost:8000/swagger.yaml' redoc

Serve local file:

    docker run -it --rm -p 80:80 \
      -v $(PWD)/demo/swagger.yaml:/usr/share/nginx/html/swagger.yaml \
      -e SPEC_URL=swagger.yaml redoc

## Runtime configuration options

- `PAGE_TITLE` (default `"ReDoc"`) - page title
- `PAGE_FAVICON` (default `"favicon.png"`) - URL to page favicon
- `SPEC_URL` (default `"http://petstore.swagger.io/v2/swagger.json"`) - URL to spec
- `PORT` (default `80`) - nginx port
- `REDOC_OPTIONS` - [`<redoc>` tag attributes](https://github.com/Rebilly/ReDoc#redoc-tag-attributes)