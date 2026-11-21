from functools import lru_cache
import asyncio
import ssl
import smtplib
from email.message import EmailMessage
import logging
from src.core.config import get_settings

logger = logging.getLogger("tura_limpia.email_service")


class EmailService:
    def __init__(self, sender_email: str, password: str, smtp_port: int, smtp_host: str = "smtp.gmail.com"):
        self.sender_email = sender_email
        self.password = password
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port

    def _enviar_smtp(self, email_destino: str, nombre: str, codigo: str) -> None:
        em = EmailMessage()
        em["From"] = self.sender_email
        em["To"] = email_destino
        em["Subject"] = "Tu código de confirmación - Tura Limpia"
        em.set_content(f"Hola {nombre}, tu código de verificación es: {codigo}")

        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, context=context, timeout=10) as smtp:
            smtp.login(self.sender_email, self.password)
            smtp.send_message(em)

    async def enviar_codigo_verificacion(self, email_destino: str, nombre: str, codigo: str) -> None:
        try:
            await asyncio.to_thread(self._enviar_smtp, email_destino, nombre, codigo)
        except Exception as e:
            logger.error(f"Error al enviar correo SMTP a {email_destino}: {e}")
            raise RuntimeError(f"No se pudo enviar el correo de verificación. {e}")


@lru_cache
def get_email_service() -> EmailService:
    settings = get_settings()
    return EmailService(
        sender_email=settings.email_sender,
        password=settings.email_password,
        smtp_port=settings.email_port,
    )