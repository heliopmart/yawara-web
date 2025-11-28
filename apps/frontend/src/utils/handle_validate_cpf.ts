interface CpfValidationResult {
  valid: boolean;
  message: string;
}

export function validateCpf(cpf: string): CpfValidationResult {
  if (!cpf) return { valid: false, message: "O CPF é obrigatório." };

  const formatRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
  if (!formatRegex.test(cpf)) {
    return { valid: false, message: "Formato inválido. Use 000.000.000-00" };
  }

  const cleanCPF = cpf.replace(/\D/g, "");

  if (cleanCPF.length !== 11 || /^(\d)\1+$/.test(cleanCPF)) {
    return { valid: false, message: "CPF inválido." };
  }

  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) {
    return { valid: false, message: "CPF inválido (Dígito verificador incorreto)." };
  }

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) {
    return { valid: false, message: "CPF inválido (Dígito verificador incorreto)." };
  }

  return { valid: true, message: "" }
}