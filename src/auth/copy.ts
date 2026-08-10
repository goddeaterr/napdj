import type { Lang } from '../lib/i18n'

/** Auth copy lives here rather than in i18n.ts, which is already enormous. */
export const AUTH_COPY = {
  en: {
    signInTitle: 'Welcome back',
    signInSub: 'Sign in to manage your lessons and bookings.',
    signUpTitle: 'Create your account',
    signUpSub: 'An account lets you book lessons and follow how many you have left.',
    forgotTitle: 'Forgot your password?',
    forgotSub: 'Enter your e-mail and we will send you a link to choose a new one.',
    resetTitle: 'Choose a new password',
    resetSub: 'Pick something long enough to be hard to guess.',
    verifyTitle: 'Confirming your e-mail',

    name: 'Full name',
    email: 'E-mail',
    password: 'Password',
    newPassword: 'New password',
    phone: 'Phone (optional)',
    passwordHint: 'At least 8 characters. A short phrase works well.',

    signIn: 'Sign in',
    signUp: 'Create account',
    sendLink: 'Send the link',
    savePassword: 'Save password',

    noAccount: 'No account yet?',
    haveAccount: 'Already have an account?',
    forgotLink: 'Forgot your password?',
    backToSignIn: 'Back to sign in',
    backToSite: 'Back to the site',

    consent: 'I agree to the {privacy} and {terms}.',
    consentPrivacy: 'Privacy Policy',
    consentTerms: 'Terms of Service',

    checkInbox: 'Check your inbox',
    checkInboxBody: 'If that address can have an account, a message is on its way. The link works for 24 hours.',
    resetSentTitle: 'Check your inbox',
    resetSentBody: 'If that address has an account, we have sent a link to choose a new password. It works for one hour.',
    verifiedTitle: 'E-mail confirmed',
    verifiedBody: 'Your account is ready. You can book lessons now.',
    goToAccount: 'Go to my account',

    unverifiedTitle: 'Confirm your e-mail',
    unverifiedBody: 'We sent a confirmation link to {email}. Confirm it to book lessons.',
    resendLink: 'Send it again',
    resendDone: 'Sent — check your inbox.',

    errors: {
      name_required: 'Please enter your name.',
      email_invalid: 'That e-mail address does not look right.',
      consent_required: 'Please accept the Privacy Policy and Terms to continue.',
      password_too_short: 'Use at least 8 characters.',
      password_too_long: 'That password is too long.',
      password_too_common: 'That password is too easy to guess. Try something else.',
      invalid_credentials: 'E-mail or password is not correct.',
      account_locked: 'Too many attempts. Try again in 15 minutes, or reset your password.',
      too_many_requests: 'Too many attempts. Please wait a few minutes.',
      link_invalid: 'This link is not valid. It may have been used already.',
      link_expired: 'This link has expired. Please request a new one.',
      network_error: 'Could not reach the server. Check your connection.',
      server_error: 'Something went wrong. Please try again.',
      json_required: 'Something went wrong. Please try again.',
      method_not_allowed: 'Something went wrong. Please try again.',
      unknown_action: 'Something went wrong. Please try again.',
      user_not_found: 'Account not found.',
    } as Record<string, string>,
  },

  ru: {
    signInTitle: 'С возвращением',
    signInSub: 'Войдите, чтобы управлять уроками и записями.',
    signUpTitle: 'Создайте аккаунт',
    signUpSub: 'С аккаунтом можно записываться на уроки и следить, сколько их осталось.',
    forgotTitle: 'Забыли пароль?',
    forgotSub: 'Введите e-mail — пришлём ссылку для смены пароля.',
    resetTitle: 'Новый пароль',
    resetSub: 'Выберите достаточно длинный пароль, чтобы его было трудно угадать.',
    verifyTitle: 'Подтверждаем e-mail',

    name: 'Полное имя',
    email: 'E-mail',
    password: 'Пароль',
    newPassword: 'Новый пароль',
    phone: 'Телефон (необязательно)',
    passwordHint: 'Минимум 8 символов. Короткая фраза подойдёт отлично.',

    signIn: 'Войти',
    signUp: 'Создать аккаунт',
    sendLink: 'Отправить ссылку',
    savePassword: 'Сохранить пароль',

    noAccount: 'Ещё нет аккаунта?',
    haveAccount: 'Уже есть аккаунт?',
    forgotLink: 'Забыли пароль?',
    backToSignIn: 'Вернуться ко входу',
    backToSite: 'Вернуться на сайт',

    consent: 'Я принимаю {privacy} и {terms}.',
    consentPrivacy: 'Политику конфиденциальности',
    consentTerms: 'Условия использования',

    checkInbox: 'Проверьте почту',
    checkInboxBody: 'Если для этого адреса возможен аккаунт, письмо уже в пути. Ссылка действует 24 часа.',
    resetSentTitle: 'Проверьте почту',
    resetSentBody: 'Если аккаунт с таким адресом есть, мы отправили ссылку для смены пароля. Она действует один час.',
    verifiedTitle: 'E-mail подтверждён',
    verifiedBody: 'Аккаунт готов. Теперь можно записываться на уроки.',
    goToAccount: 'В личный кабинет',

    unverifiedTitle: 'Подтвердите e-mail',
    unverifiedBody: 'Мы отправили ссылку на {email}. Подтвердите её, чтобы записываться на уроки.',
    resendLink: 'Отправить ещё раз',
    resendDone: 'Отправлено — проверьте почту.',

    errors: {
      name_required: 'Введите имя.',
      email_invalid: 'Похоже, адрес указан неверно.',
      consent_required: 'Примите политику конфиденциальности и условия, чтобы продолжить.',
      password_too_short: 'Минимум 8 символов.',
      password_too_long: 'Слишком длинный пароль.',
      password_too_common: 'Такой пароль слишком легко угадать. Придумайте другой.',
      invalid_credentials: 'Неверный e-mail или пароль.',
      account_locked: 'Слишком много попыток. Попробуйте через 15 минут или смените пароль.',
      too_many_requests: 'Слишком много попыток. Подождите несколько минут.',
      link_invalid: 'Ссылка недействительна. Возможно, её уже использовали.',
      link_expired: 'Срок действия ссылки истёк. Запросите новую.',
      network_error: 'Не удалось связаться с сервером. Проверьте соединение.',
      server_error: 'Что-то пошло не так. Попробуйте ещё раз.',
      json_required: 'Что-то пошло не так. Попробуйте ещё раз.',
      method_not_allowed: 'Что-то пошло не так. Попробуйте ещё раз.',
      unknown_action: 'Что-то пошло не так. Попробуйте ещё раз.',
      user_not_found: 'Аккаунт не найден.',
    } as Record<string, string>,
  },

  lt: {
    signInTitle: 'Sveiki sugrįžę',
    signInSub: 'Prisijunkite, kad valdytumėte pamokas ir registracijas.',
    signUpTitle: 'Sukurkite paskyrą',
    signUpSub: 'Su paskyra galėsite registruotis į pamokas ir matyti, kiek jų liko.',
    forgotTitle: 'Pamiršote slaptažodį?',
    forgotSub: 'Įveskite el. paštą — atsiųsime nuorodą naujam slaptažodžiui.',
    resetTitle: 'Naujas slaptažodis',
    resetSub: 'Pasirinkite pakankamai ilgą, kad būtų sunku atspėti.',
    verifyTitle: 'Patvirtiname el. paštą',

    name: 'Pilnas vardas',
    email: 'El. paštas',
    password: 'Slaptažodis',
    newPassword: 'Naujas slaptažodis',
    phone: 'Telefonas (neprivaloma)',
    passwordHint: 'Bent 8 simboliai. Trumpa frazė puikiai tinka.',

    signIn: 'Prisijungti',
    signUp: 'Sukurti paskyrą',
    sendLink: 'Siųsti nuorodą',
    savePassword: 'Išsaugoti slaptažodį',

    noAccount: 'Dar neturite paskyros?',
    haveAccount: 'Jau turite paskyrą?',
    forgotLink: 'Pamiršote slaptažodį?',
    backToSignIn: 'Grįžti į prisijungimą',
    backToSite: 'Grįžti į svetainę',

    consent: 'Sutinku su {privacy} ir {terms}.',
    consentPrivacy: 'Privatumo politika',
    consentTerms: 'Naudojimo sąlygomis',

    checkInbox: 'Patikrinkite el. paštą',
    checkInboxBody: 'Jei šiam adresui galima paskyra, laiškas jau pakeliui. Nuoroda galioja 24 valandas.',
    resetSentTitle: 'Patikrinkite el. paštą',
    resetSentBody: 'Jei paskyra su tokiu adresu yra, išsiuntėme nuorodą slaptažodžiui pakeisti. Ji galioja vieną valandą.',
    verifiedTitle: 'El. paštas patvirtintas',
    verifiedBody: 'Paskyra paruošta. Dabar galite registruotis į pamokas.',
    goToAccount: 'Į mano paskyrą',

    unverifiedTitle: 'Patvirtinkite el. paštą',
    unverifiedBody: 'Išsiuntėme patvirtinimo nuorodą į {email}. Patvirtinkite, kad galėtumėte registruotis.',
    resendLink: 'Siųsti dar kartą',
    resendDone: 'Išsiųsta — patikrinkite paštą.',

    errors: {
      name_required: 'Įveskite vardą.',
      email_invalid: 'Panašu, kad el. pašto adresas neteisingas.',
      consent_required: 'Norėdami tęsti, sutikite su privatumo politika ir sąlygomis.',
      password_too_short: 'Bent 8 simboliai.',
      password_too_long: 'Slaptažodis per ilgas.',
      password_too_common: 'Tokį slaptažodį per lengva atspėti. Pasirinkite kitą.',
      invalid_credentials: 'Neteisingas el. paštas arba slaptažodis.',
      account_locked: 'Per daug bandymų. Bandykite po 15 minučių arba pakeiskite slaptažodį.',
      too_many_requests: 'Per daug bandymų. Palaukite kelias minutes.',
      link_invalid: 'Nuoroda negalioja. Galbūt ji jau panaudota.',
      link_expired: 'Nuorodos galiojimas baigėsi. Paprašykite naujos.',
      network_error: 'Nepavyko susisiekti su serveriu. Patikrinkite ryšį.',
      server_error: 'Kažkas nutiko. Bandykite dar kartą.',
      json_required: 'Kažkas nutiko. Bandykite dar kartą.',
      method_not_allowed: 'Kažkas nutiko. Bandykite dar kartą.',
      unknown_action: 'Kažkas nutiko. Bandykite dar kartą.',
      user_not_found: 'Paskyra nerasta.',
    } as Record<string, string>,
  },
} satisfies Record<Lang, unknown>

export type AuthCopy = typeof AUTH_COPY.en

export const authCopy = (lang: Lang): AuthCopy =>
  (AUTH_COPY[lang] ?? AUTH_COPY.en) as AuthCopy

export const authError = (lang: Lang, code: string | null): string | null => {
  if (!code) return null
  const c = authCopy(lang)
  return c.errors[code] ?? c.errors.server_error
}
