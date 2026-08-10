/** Copy for the account gate in front of the booking form. */
export const BOOK_GATE: Record<string, {
  title: string; body: string; signUp: string; signIn: string
  verifyTitle: string; verifyBody: string; verifyResend: string; verifySent: string
  bookingAs: string; myAccount: string
}> = {
  en: {
    title: 'Create an account to book',
    body: 'Booking a lesson needs an account. It takes a minute, and it is how you follow how many lessons you have left.',
    signUp: 'Create account',
    signIn: 'I already have one',
    verifyTitle: 'Confirm your e-mail first',
    verifyBody: 'We sent a link to {email}. Confirm it and you can book straight away.',
    verifyResend: 'Send the link again',
    verifySent: 'Sent — check your inbox ✓',
    bookingAs: 'Booking as',
    myAccount: 'My account',
  },
  ru: {
    title: 'Создайте аккаунт для записи',
    body: 'Для записи на урок нужен аккаунт. Это займёт минуту — и так вы будете видеть, сколько уроков осталось.',
    signUp: 'Создать аккаунт',
    signIn: 'У меня уже есть',
    verifyTitle: 'Сначала подтвердите e-mail',
    verifyBody: 'Мы отправили ссылку на {email}. Подтвердите — и сразу сможете записаться.',
    verifyResend: 'Отправить ссылку снова',
    verifySent: 'Отправлено — проверьте почту ✓',
    bookingAs: 'Запись от имени',
    myAccount: 'Мой аккаунт',
  },
  lt: {
    title: 'Registracijai reikia paskyros',
    body: 'Norint registruotis į pamoką reikia paskyros. Užtruks minutę — ir matysite, kiek pamokų liko.',
    signUp: 'Sukurti paskyrą',
    signIn: 'Jau turiu paskyrą',
    verifyTitle: 'Pirmiausia patvirtinkite el. paštą',
    verifyBody: 'Išsiuntėme nuorodą į {email}. Patvirtinkite ir galėsite registruotis iš karto.',
    verifyResend: 'Siųsti nuorodą dar kartą',
    verifySent: 'Išsiųsta — patikrinkite paštą ✓',
    bookingAs: 'Registruojasi',
    myAccount: 'Mano paskyra',
  },
}
