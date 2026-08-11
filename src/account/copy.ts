/** Student dashboard copy, in the three site languages. */
export const DASH_COPY: Record<string, {
  title: string; greeting: string; subtitle: string; signOut: string
  lessonsLeft: string; lessonLeftOne: string; balanceReady: string; balanceEmpty: string
  bookLesson: string
  yourBookings: string; noBookings: string; noPreference: string
  lessonHistory: string; noLessons: string
  yourDetails: string; name: string; email: string; phone: string; memberSince: string
  needHelp: string
  cancel: string; cancelAsk: string; cancelTooLate: string; cancelFailed: string
  verifyTitle: string; verifyBody: string; verifyResend: string; verifySent: string
  statuses: Record<string, string>
  kinds: Record<string, string>
}> = {
  en: {
    title: 'My account',
    greeting: 'Hello, {name}',
    subtitle: 'Your lessons, your bookings and everything we hold about you.',
    signOut: 'Sign out',
    lessonsLeft: 'lessons left',
    lessonLeftOne: 'lesson left',
    balanceReady: 'Ready when you are — pick a time that suits you.',
    balanceEmpty: 'No lessons on your account yet. Book a first session and we will sort the rest out together.',
    bookLesson: 'Book a lesson',
    yourBookings: 'Your bookings',
    noBookings: 'No bookings yet.',
    noPreference: 'No preferred time',
    lessonHistory: 'Lesson history',
    noLessons: 'Nothing here yet. Lessons appear once we add them to your account.',
    yourDetails: 'Your details',
    name: 'Name', email: 'E-mail', phone: 'Phone', memberSince: 'Member since',
    needHelp: 'Need a hand? Write or call us:',
    cancel: 'Cancel', cancelAsk: 'Cancel this lesson?',
    cancelTooLate: 'Lessons can only be cancelled more than 24 hours in advance. Please call us.',
    cancelFailed: 'Could not cancel. Please try again or contact us.',
    verifyTitle: 'Confirm your e-mail',
    verifyBody: 'We sent a link to {email}. Confirm it so we can reach you about your lessons.',
    verifyResend: 'Send again',
    verifySent: 'Sent ✓',
    statuses: {
      new: 'Awaiting confirmation', contacted: 'We have been in touch',
      confirmed: 'Confirmed', done: 'Completed', cancelled: 'Cancelled',
    },
    kinds: { purchase: 'Purchased', free: 'Free lesson', used: 'Lesson used', adjustment: 'Adjustment' },
  },

  ru: {
    title: 'Мой аккаунт',
    greeting: 'Привет, {name}',
    subtitle: 'Ваши уроки, записи и все данные, которые мы храним.',
    signOut: 'Выйти',
    lessonsLeft: 'уроков осталось',
    lessonLeftOne: 'урок остался',
    balanceReady: 'Всё готово — выберите удобное время.',
    balanceEmpty: 'Пока уроков на счету нет. Запишитесь на первое занятие, остальное решим вместе.',
    bookLesson: 'Записаться на урок',
    yourBookings: 'Ваши записи',
    noBookings: 'Записей пока нет.',
    noPreference: 'Без предпочтений по времени',
    lessonHistory: 'История уроков',
    noLessons: 'Пока пусто. Уроки появятся, когда мы добавим их на ваш счёт.',
    yourDetails: 'Ваши данные',
    name: 'Имя', email: 'E-mail', phone: 'Телефон', memberSince: 'С нами с',
    needHelp: 'Нужна помощь? Напишите или позвоните:',
    cancel: 'Отменить', cancelAsk: 'Отменить этот урок?',
    cancelTooLate: 'Отменить можно не позднее чем за 24 часа. Пожалуйста, позвоните нам.',
    cancelFailed: 'Не удалось отменить. Попробуйте снова или свяжитесь с нами.',
    verifyTitle: 'Подтвердите e-mail',
    verifyBody: 'Мы отправили ссылку на {email}. Подтвердите её, чтобы мы могли связаться с вами по урокам.',
    verifyResend: 'Отправить снова',
    verifySent: 'Отправлено ✓',
    statuses: {
      new: 'Ожидает подтверждения', contacted: 'Мы связались',
      confirmed: 'Подтверждено', done: 'Завершено', cancelled: 'Отменено',
    },
    kinds: { purchase: 'Куплено', free: 'Бесплатный урок', used: 'Урок использован', adjustment: 'Корректировка' },
  },

  lt: {
    title: 'Mano paskyra',
    greeting: 'Sveiki, {name}',
    subtitle: 'Jūsų pamokos, registracijos ir visi jūsų duomenys.',
    signOut: 'Atsijungti',
    lessonsLeft: 'liko pamokų',
    lessonLeftOne: 'liko pamoka',
    balanceReady: 'Viskas paruošta — pasirinkite jums tinkamą laiką.',
    balanceEmpty: 'Kol kas pamokų paskyroje nėra. Užsiregistruokite į pirmą — visa kita sutvarkysime kartu.',
    bookLesson: 'Registruotis į pamoką',
    yourBookings: 'Jūsų registracijos',
    noBookings: 'Registracijų dar nėra.',
    noPreference: 'Be pageidaujamo laiko',
    lessonHistory: 'Pamokų istorija',
    noLessons: 'Kol kas tuščia. Pamokos atsiras, kai jas pridėsime prie paskyros.',
    yourDetails: 'Jūsų duomenys',
    name: 'Vardas', email: 'El. paštas', phone: 'Telefonas', memberSince: 'Su mumis nuo',
    needHelp: 'Reikia pagalbos? Rašykite arba skambinkite:',
    cancel: 'Atšaukti', cancelAsk: 'Atšaukti šią pamoką?',
    cancelTooLate: 'Atšaukti galima ne vėliau kaip prieš 24 valandas. Prašome paskambinti.',
    cancelFailed: 'Nepavyko atšaukti. Bandykite dar kartą arba susisiekite su mumis.',
    verifyTitle: 'Patvirtinkite el. paštą',
    verifyBody: 'Išsiuntėme nuorodą į {email}. Patvirtinkite, kad galėtume su jumis susisiekti dėl pamokų.',
    verifyResend: 'Siųsti dar kartą',
    verifySent: 'Išsiųsta ✓',
    statuses: {
      new: 'Laukia patvirtinimo', contacted: 'Susisiekėme',
      confirmed: 'Patvirtinta', done: 'Įvykusi', cancelled: 'Atšaukta',
    },
    kinds: { purchase: 'Įsigyta', free: 'Nemokama pamoka', used: 'Panaudota pamoka', adjustment: 'Koregavimas' },
  },
}
