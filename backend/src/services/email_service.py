
from functools import lru_cache
import logging

import resend

from src.core.config import get_settings

logger = logging.getLogger("tura_limpia.email_service")


class EmailService:
    def __init__(self, api_key: str, sender_email: str):
        self.api_key = api_key
        self.sender_email = sender_email

    async def enviar_codigo_verificacion(
        self,
        email_destino: str,
        nombre: str,
        codigo: str
    ) -> None:
        try:
            resend.api_key = self.api_key

            params = {
                "from": self.sender_email,
                "to": [email_destino],
                "subject": "Tu código de confirmación - Tura Limpia",
                "html": f"""
                    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
                        <h2>¡Hola, {nombre}!</h2>
                        <p>Tu código de verificación para Tura Limpia es:</p>
                        <div style="
                            background-color: #f1f5f9;
                            padding: 20px;
                            text-align: center;
                            font-size: 30px;
                            font-weight: bold;
                            letter-spacing: 8px;
                            border-radius: 8px;
                        ">
                            {codigo}
                        </div>
                        <p>Este código tiene una vigencia limitada.</p>
                        <p>Si no solicitaste este código, puedes ignorar este correo.</p>
                        <p>Equipo Tura Limpia</p>
                    </div>
                """
            }

            await resend.Emails.send_async(params)

            logger.info(
                "Correo de verificación enviado correctamente a %s",
                email_destino
            )

        except Exception as e:
            logger.error(
                "Error al enviar correo con Resend a %s: %s",
                email_destino,
                e
            )
            raise RuntimeError(
                "No se pudo enviar el correo de verificación."
            ) from e


@lru_cache
def get_email_service() -> EmailService:
    settings = get_settings()

    return EmailService(
        api_key=settings.resend_api_key,
        sender_email="Tura Limpia <verificacion@turalimpia.store>",
    )
