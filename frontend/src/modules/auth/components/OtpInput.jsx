import { useRef } from 'react'

export function OtpInput({ length = 6, value = '', onChange, disabled = false }) {
  const inputsRef = useRef([])
  const digits = Array.from({ length }, (_, idx) => value[idx] || '')

  const focusInput = (index) => {
    const target = inputsRef.current[index]
    if (target) {
      target.focus()
      target.select()
    }
  }

  const handleChange = (index, rawValue) => {
    const clean = rawValue.replace(/\D/g, '')
    if (!clean) {
      const next = [...digits]
      next[index] = ''
      onChange(next.join(''))
      return
    }

    const next = [...digits]
    clean.split('').forEach((char, offset) => {
      if (index + offset < length) {
        next[index + offset] = char
      }
    })

    onChange(next.join(''))

    const nextIndex = Math.min(index + clean.length, length - 1)
    focusInput(nextIndex)
  }

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits]
        next[index] = ''
        onChange(next.join(''))
      } else if (index > 0) {
        focusInput(index - 1)
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      focusInput(index - 1)
    } else if (event.key === 'ArrowRight' && index < length - 1) {
      focusInput(index + 1)
    }
  }

  const handlePaste = (event) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    onChange(pasted)
    focusInput(Math.min(pasted.length, length - 1))
  }

  return (
    <div className="tl-otp-group" role="group" aria-label="Código de verificación">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          disabled={disabled}
          className={`tl-otp-cell ${digit ? 'is-filled' : ''}`}
          aria-label={`Dígito ${index + 1} de ${length}`}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  )
}