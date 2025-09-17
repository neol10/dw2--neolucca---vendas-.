from fastapi import HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging
from datetime import datetime

# Configurar logging
logging.basicConfig(
    filename='app.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Criar limiter
limiter = Limiter(key_func=get_remote_address)

# CORS configuração com whitelist
CORS_ORIGINS = [
    "http://localhost",
    "http://localhost:8080",
    "http://127.0.0.1",
    "http://127.0.0.1:8080",
    # Adicione aqui os domínios permitidos em produção
]

CORS_MIDDLEWARE = CORSMiddleware(
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Função para logging de erros
def log_error(request: Request, error: Exception):
    logging.error(
        f"Error: {str(error)} - "
        f"Path: {request.url.path} - "
        f"Method: {request.method} - "
        f"Client: {request.client.host} - "
        f"Time: {datetime.now().isoformat()}"
    )

# Middleware de logging
async def logging_middleware(request: Request, call_next):
    try:
        response = await call_next(request)
        # Log successful requests
        if response.status_code >= 400:
            logging.warning(
                f"Status {response.status_code} - "
                f"Path: {request.url.path} - "
                f"Method: {request.method} - "
                f"Client: {request.client.host}"
            )
        return response
    except Exception as exc:
        # Log errors
        log_error(request, exc)
        raise exc

# Exception handler
def handle_exception(request: Request, exc: Exception):
    log_error(request, exc)
    return HTTPException(
        status_code=500,
        detail="Ocorreu um erro interno. Por favor, tente novamente mais tarde."
    )