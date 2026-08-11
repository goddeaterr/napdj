/* ============================================================================
   LEGAL PAGES CONTENT — EN / RU / LT
   ----------------------------------------------------------------------------
   All company-specific values (name, address, e-mail, phone, company code)
   come from src/config/site.ts — fill them in there, not here.
============================================================================ */
import type { Lang } from '../lib/i18n'
import { CONTACT, LEGAL, SITE_URL } from '../config/site'

export interface LegalSection { heading: string; body: string[] }

export interface LegalPage {
  path: string
  title: Record<Lang, string>
  intro: Record<Lang, string>
  sections: Record<Lang, LegalSection[]>
}

const brand     = LEGAL.brand
const legalName = LEGAL.companyName || LEGAL.brand
const address   = LEGAL.registeredAddress || `${CONTACT.city}, ${CONTACT.country}`
const email     = CONTACT.email
const dpoEmail  = LEGAL.dataContactEmail || CONTACT.email
const phone     = CONTACT.phone
const director  = LEGAL.director

/* ── Privacy Policy ────────────────────────────────────────────────────── */
const privacy: LegalPage = {
  path: '/privacy',
  title: { en: 'Privacy Policy', ru: 'Политика конфиденциальности', lt: 'Privatumo politika' },
  intro: {
    en: `This policy explains what personal data ${brand} collects through ${SITE_URL}, why we collect it, and what rights you have under the EU General Data Protection Regulation (GDPR).`,
    ru: `Эта политика объясняет, какие персональные данные ${brand} собирает через ${SITE_URL}, зачем мы их собираем и какие права у вас есть согласно Общему регламенту ЕС по защите данных (GDPR).`,
    lt: `Ši politika paaiškina, kokius asmens duomenis ${brand} renka per ${SITE_URL}, kodėl juos renkame ir kokias teises turite pagal ES Bendrąjį duomenų apsaugos reglamentą (BDAR).`,
  },
  sections: {
    en: [
      { heading: '1. Data controller', body: [
        `${legalName}${LEGAL.companyCode ? `, company code ${LEGAL.companyCode}` : ''}${LEGAL.vatCode ? `, VAT code ${LEGAL.vatCode}` : ''}, ${address}.`,
        `Represented by ${director}, director.`,
        `E-mail: ${dpoEmail} · Phone: ${phone}`,
        'We are the controller of the personal data described below. We have not appointed a Data Protection Officer, as we are not required to; data questions are handled directly at the address above.',
      ]},
      { heading: '2. What we collect', body: [
        '• Booking form: your name, e-mail address, phone number (optional), the course you selected, your preferred genre, preferred date and time, and any message you write.',
        '• Account: to book a lesson you create an account. We store your name, e-mail address, phone number (optional), preferred language, a cryptographic hash of your password (never the password itself), and the record of lessons purchased, granted and used.',
        '• Sign-in security: the time of your last sign-in and a count of failed attempts, kept so that an account being guessed at can be locked.',
        '• Correspondence: the content of e-mails or messages you send us.',
        '• Technical data: our hosting provider processes standard server logs (IP address, browser type, time of request) for security and availability. We do not run analytics, advertising or tracking scripts.',
        'We do not knowingly collect data from children under 14 without the consent of a parent or guardian, and we never collect special categories of data.',
      ]},
      { heading: '3. Why we use it and on what legal basis', body: [
        '• To answer your booking request and arrange lessons — performance of a contract or steps taken at your request (GDPR Art. 6(1)(b)).',
        '• To send you a confirmation e-mail about your own booking — same basis. This is not marketing and we do not add you to any mailing list.',
        '• To keep records of bookings and payments — compliance with our accounting obligations (GDPR Art. 6(1)(c)).',
        '• To keep the website secure and available — our legitimate interest (GDPR Art. 6(1)(f)).',
      ]},
      { heading: '4. How long we keep it', body: [
        'Booking requests that do not become lessons are deleted within 12 months. Records relating to lessons actually delivered are kept for as long as accounting law requires (currently 10 years in Lithuania). You can ask us to delete your data earlier where no legal obligation requires us to keep it.',
      ]},
      { heading: '5. Who we share it with', body: [
        'We do not sell or rent personal data. We share it only with service providers who help us run the website and communicate with you:',
        '• Resend — delivery of booking notification and confirmation e-mails.',
        '• Our website hosting provider — storage and delivery of the site.',
        '• Google Fonts — fonts are loaded from Google servers when you open the site, which means Google receives your IP address. If you prefer this not to happen, the fonts can be self-hosted on request.',
        'Some of these providers are located outside the EU/EEA. Where that is the case, transfers are covered by the European Commission’s Standard Contractual Clauses or an adequacy decision.',
      ]},
      { heading: '6. Your rights', body: [
        'You have the right to access your data, to have it corrected or erased, to restrict or object to its processing, to receive it in a portable format, and to withdraw consent at any time where processing is based on consent.',
        `To exercise any of these rights, write to ${dpoEmail}. We reply within one month.`,
        'If you believe we handle your data unlawfully, you may lodge a complaint with the Lithuanian State Data Protection Inspectorate (Valstybinė duomenų apsaugos inspekcija, L. Sapiegos g. 17, Vilnius, ada@ada.lt).',
      ]},
      { heading: '7. Security', body: [
        'Booking data is transmitted over an encrypted connection and stored with access limited to the studio owner. The administration area is protected by a password and expiring session tokens.',
      ]},
      { heading: '8. Changes', body: [
        `We may update this policy. The current version is always published at ${SITE_URL}/privacy. Last updated: ${LEGAL.lastUpdated}.`,
      ]},
    ],
    ru: [
      { heading: '1. Оператор данных', body: [
        `${legalName}${LEGAL.companyCode ? `, код предприятия ${LEGAL.companyCode}` : ''}${LEGAL.vatCode ? `, код НДС ${LEGAL.vatCode}` : ''}, ${address}.`,
        `Представитель: ${director}, директор.`,
        `E-mail: ${dpoEmail} · Телефон: ${phone}`,
        'Мы являемся оператором описанных ниже персональных данных. Отдельный специалист по защите данных не назначен, так как закон этого от нас не требует; все вопросы решаются по указанным выше контактам.',
      ]},
      { heading: '2. Какие данные мы собираем', body: [
        '• Форма записи: имя, адрес электронной почты, телефон (необязательно), выбранный курс, предпочитаемый жанр, желаемые дата и время, а также текст сообщения.',
        '• Аккаунт: для записи на урок создаётся аккаунт. Мы храним имя, адрес электронной почты, телефон (необязательно), язык, криптографический хеш пароля (сам пароль — никогда) и историю уроков: купленных, подаренных и использованных.',
        '• Безопасность входа: время последнего входа и число неудачных попыток — чтобы заблокировать аккаунт при подборе пароля.',
        '• Переписка: содержание писем и сообщений, которые вы нам отправляете.',
        '• Технические данные: хостинг-провайдер обрабатывает стандартные журналы сервера (IP-адрес, тип браузера, время запроса) для безопасности и доступности. Мы не используем аналитику, рекламу и трекеры.',
        'Мы сознательно не собираем данные детей младше 14 лет без согласия родителя или опекуна и никогда не собираем особые категории данных.',
      ]},
      { heading: '3. Цели и правовые основания', body: [
        '• Ответ на вашу заявку и организация уроков — исполнение договора или действия по вашему запросу (ст. 6(1)(b) GDPR).',
        '• Отправка вам подтверждения о вашей собственной записи — то же основание. Это не рассылка, в маркетинговые списки мы вас не добавляем.',
        '• Ведение учёта записей и платежей — исполнение бухгалтерских обязанностей (ст. 6(1)(c) GDPR).',
        '• Обеспечение безопасности и работоспособности сайта — наш законный интерес (ст. 6(1)(f) GDPR).',
      ]},
      { heading: '4. Сроки хранения', body: [
        'Заявки, не приведшие к урокам, удаляются в течение 12 месяцев. Данные о фактически проведённых уроках хранятся столько, сколько требует бухгалтерское законодательство (в Литве — 10 лет). Вы можете попросить удалить данные раньше, если нет обязанности их хранить.',
      ]},
      { heading: '5. Кому мы передаём данные', body: [
        'Мы не продаём и не сдаём персональные данные. Мы передаём их только поставщикам услуг, которые помогают нам работать:',
        '• Resend — доставка уведомлений о записи и писем-подтверждений.',
        '• Хостинг-провайдер сайта — хранение и отдача сайта.',
        '• Google Fonts — шрифты загружаются с серверов Google при открытии сайта, поэтому Google получает ваш IP-адрес. По запросу шрифты можно разместить локально.',
        'Некоторые из этих поставщиков находятся за пределами ЕС/ЕЭЗ. В таких случаях передача защищена стандартными договорными положениями Еврокомиссии или решением об адекватности.',
      ]},
      { heading: '6. Ваши права', body: [
        'Вы вправе получить доступ к своим данным, исправить или удалить их, ограничить обработку или возразить против неё, получить данные в переносимом формате и отозвать согласие, если обработка основана на согласии.',
        `Для реализации прав напишите на ${dpoEmail}. Мы отвечаем в течение одного месяца.`,
        'Если вы считаете, что мы обрабатываем данные незаконно, вы можете подать жалобу в Государственную инспекцию по защите данных Литвы (Valstybinė duomenų apsaugos inspekcija, L. Sapiegos g. 17, Вильнюс, ada@ada.lt).',
      ]},
      { heading: '7. Безопасность', body: [
        'Данные заявок передаются по зашифрованному соединению и хранятся с доступом только для владельца студии. Административная часть защищена паролем и сессионными токенами с ограниченным сроком действия.',
      ]},
      { heading: '8. Изменения', body: [
        `Политика может обновляться. Актуальная версия всегда доступна по адресу ${SITE_URL}/privacy. Последнее обновление: ${LEGAL.lastUpdated}.`,
      ]},
    ],
    lt: [
      { heading: '1. Duomenų valdytojas', body: [
        `${legalName}${LEGAL.companyCode ? `, įmonės kodas ${LEGAL.companyCode}` : ''}${LEGAL.vatCode ? `, PVM kodas ${LEGAL.vatCode}` : ''}, ${address}.`,
        `Atstovauja direktorė ${director}.`,
        `El. paštas: ${dpoEmail} · Telefonas: ${phone}`,
        'Esame toliau aprašytų asmens duomenų valdytojas. Duomenų apsaugos pareigūno neskyrėme, nes to nereikalaujama; visi klausimai sprendžiami aukščiau nurodytais kontaktais.',
      ]},
      { heading: '2. Kokius duomenis renkame', body: [
        '• Registracijos forma: vardas, el. pašto adresas, telefono numeris (neprivaloma), pasirinktas kursas, pageidaujamas žanras, pageidaujama data ir laikas bei jūsų žinutė.',
        '• Paskyra: norint registruotis į pamoką sukuriama paskyra. Saugome vardą, el. pašto adresą, telefono numerį (neprivaloma), kalbą, kriptografinę slaptažodžio maišą (niekada — patį slaptažodį) ir pamokų istoriją: įsigytas, dovanotas ir panaudotas.',
        '• Prisijungimo saugumas: paskutinio prisijungimo laikas ir nesėkmingų bandymų skaičius — kad būtų galima užrakinti paskyrą, jei bandoma spėlioti slaptažodį.',
        '• Susirašinėjimas: jūsų siunčiamų laiškų ir žinučių turinys.',
        '• Techniniai duomenys: prieglobos paslaugų teikėjas tvarko įprastus serverio žurnalus (IP adresą, naršyklės tipą, užklausos laiką) saugumo ir prieinamumo tikslais. Analitikos, reklamos ar sekimo scenarijų nenaudojame.',
        'Sąmoningai nerenkame jaunesnių nei 14 metų vaikų duomenų be tėvų ar globėjų sutikimo ir niekada nerenkame specialių kategorijų duomenų.',
      ]},
      { heading: '3. Tikslai ir teisinis pagrindas', body: [
        '• Atsakyti į jūsų užklausą ir suderinti pamokas — sutarties vykdymas arba veiksmai jūsų prašymu (BDAR 6 str. 1 d. b p.).',
        '• Išsiųsti jums patvirtinimą apie jūsų pačių registraciją — tas pats pagrindas. Tai nėra rinkodara, į jokius adresatų sąrašus jūsų neįtraukiame.',
        '• Tvarkyti registracijų ir mokėjimų apskaitą — teisinės prievolės vykdymas (BDAR 6 str. 1 d. c p.).',
        '• Užtikrinti svetainės saugumą ir veikimą — mūsų teisėtas interesas (BDAR 6 str. 1 d. f p.).',
      ]},
      { heading: '4. Saugojimo terminai', body: [
        'Užklausos, kurios netapo pamokomis, ištrinamos per 12 mėnesių. Duomenys apie faktiškai suteiktas paslaugas saugomi tiek, kiek reikalauja buhalterinės apskaitos teisės aktai (Lietuvoje – 10 metų). Galite prašyti ištrinti duomenis anksčiau, jei jų saugoti neįpareigoja teisės aktai.',
      ]},
      { heading: '5. Kam perduodame duomenis', body: [
        'Asmens duomenų neparduodame ir nenuomojame. Juos perduodame tik paslaugų teikėjams, padedantiems mums dirbti:',
        '• Resend — registracijos pranešimų ir patvirtinimo laiškų pristatymas.',
        '• Svetainės prieglobos teikėjas — svetainės saugojimas ir pateikimas.',
        '• Google Fonts — šriftai atsiunčiami iš Google serverių atidarius svetainę, todėl Google gauna jūsų IP adresą. Pageidaujant šriftus galima talpinti vietoje.',
        'Kai kurie teikėjai yra už ES/EEE ribų. Tokiais atvejais perdavimas grindžiamas Europos Komisijos standartinėmis sutarčių sąlygomis arba sprendimu dėl tinkamumo.',
      ]},
      { heading: '6. Jūsų teisės', body: [
        'Turite teisę susipažinti su savo duomenimis, reikalauti juos ištaisyti ar ištrinti, apriboti tvarkymą ar jam nesutikti, gauti duomenis perkeliamu formatu ir bet kada atšaukti sutikimą, kai tvarkymas grindžiamas sutikimu.',
        `Norėdami pasinaudoti teisėmis, rašykite ${dpoEmail}. Atsakome per vieną mėnesį.`,
        'Jei manote, kad duomenis tvarkome neteisėtai, galite pateikti skundą Valstybinei duomenų apsaugos inspekcijai (L. Sapiegos g. 17, Vilnius, ada@ada.lt).',
      ]},
      { heading: '7. Saugumas', body: [
        'Registracijų duomenys perduodami šifruotu ryšiu ir saugomi suteikiant prieigą tik studijos savininkui. Administravimo sritis apsaugota slaptažodžiu ir ribotos trukmės seanso raktais.',
      ]},
      { heading: '8. Pakeitimai', body: [
        `Ši politika gali būti atnaujinama. Galiojanti versija visada skelbiama ${SITE_URL}/privacy. Paskutinį kartą atnaujinta: ${LEGAL.lastUpdated}.`,
      ]},
    ],
  },
}

/* ── Terms of Service ──────────────────────────────────────────────────── */
const terms: LegalPage = {
  path: '/terms',
  title: { en: 'Terms of Service', ru: 'Условия оказания услуг', lt: 'Paslaugų teikimo sąlygos' },
  intro: {
    en: `These terms govern DJ lessons and studio services provided by ${legalName} and the use of ${SITE_URL}. By submitting a booking request you accept them.`,
    ru: `Настоящие условия регулируют DJ-уроки и услуги студии, оказываемые ${legalName}, а также использование сайта ${SITE_URL}. Отправляя заявку, вы принимаете их.`,
    lt: `Šios sąlygos reglamentuoja ${legalName} teikiamas DJ pamokas bei studijos paslaugas ir naudojimąsi ${SITE_URL}. Pateikdami registracijos užklausą jas priimate.`,
  },
  sections: {
    en: [
      { heading: '1. Provider', body: [
        `${legalName}, ${address}${LEGAL.companyCode ? `, company code ${LEGAL.companyCode}` : ''}. E-mail ${email}, phone ${phone}.`,
        `Represented by ${director}, director. Registered on ${LEGAL.registeredOn}.`,
      ]},
      { heading: '2. Booking', body: [
        'Submitting the form is a request, not a confirmed reservation. A lesson is booked only once we confirm the date and time by e-mail or phone, normally within 24 hours.',
        'Lessons take place at our studio on weekdays (Monday to Friday) during opening hours, at the time agreed individually with you.',
      ]},
      { heading: '3. Prices and payment', body: [
        'Prices shown on the website are in euro and include all applicable taxes. Payment is made on site before or at the first lesson of the package, unless agreed otherwise.',
        'We may change published prices at any time, but never for a booking that is already confirmed.',
      ]},
      { heading: '4. Trial lesson and refunds', body: [
        'If the first lesson of a package is not right for you, tell us before leaving the studio or within 24 hours and we refund it in full. Detailed rules are in our Refund & Cancellation Policy.',
      ]},
      { heading: '5. Cancelling or rescheduling', body: [
        'You may reschedule or cancel a lesson free of charge by giving at least 24 hours’ notice. A lesson cancelled later, or missed without notice, may be counted as used.',
        'If we have to cancel, you choose between a new time and a full refund of that lesson.',
      ]},
      { heading: '6. Studio rules and equipment', body: [
        'Equipment must be used as instructed. You are liable for damage caused intentionally or by gross negligence. Attending under the influence of alcohol or drugs is not permitted, and we may end a lesson on that basis without a refund.',
      ]},
      { heading: '7. Recordings and photos', body: [
        'Step 4 performances are recorded so you receive a portfolio piece. We publish recordings, photos or video showing you only with your separate, explicit consent, which you can withdraw at any time.',
      ]},
      { heading: '8. Intellectual property', body: [
        'Course materials, this website and its content belong to us and are provided for your personal learning use. They may not be resold, republished or used to run competing courses.',
      ]},
      { heading: '9. Right of withdrawal (distance contracts)', body: [
        'When a contract is concluded remotely, consumers in the EU may withdraw within 14 days without giving a reason. If you ask us to start lessons within that period, you owe a proportionate amount for lessons already delivered. To withdraw, write to ' + email + '.',
        'Consumers may also use the European Commission’s Online Dispute Resolution platform: https://ec.europa.eu/consumers/odr',
      ]},
      { heading: '10. Liability', body: [
        'We provide the lessons with professional care. We are not liable for indirect losses or for outcomes such as bookings, gigs or career results, which depend on many factors outside our control. Nothing in these terms limits liability that cannot be limited by law, including for death or personal injury caused by our negligence.',
      ]},
      { heading: '11. Applicable law', body: [
        'Lithuanian law applies. Disputes are resolved in the courts of the Republic of Lithuania, without affecting consumer rights to bring a claim in their country of residence.',
        `Last updated: ${LEGAL.lastUpdated}.`,
      ]},
    ],
    ru: [
      { heading: '1. Исполнитель', body: [
        `${legalName}, ${address}${LEGAL.companyCode ? `, код предприятия ${LEGAL.companyCode}` : ''}. E-mail ${email}, телефон ${phone}.`,
        `Представитель: ${director}, директор. Дата регистрации: ${LEGAL.registeredOn}.`,
      ]},
      { heading: '2. Запись', body: [
        'Отправка формы — это заявка, а не подтверждённая бронь. Урок считается забронированным только после того, как мы подтвердим дату и время по e-mail или телефону, обычно в течение 24 часов.',
        'Уроки проходят в нашей студии по будням (с понедельника по пятницу) в рабочие часы, в согласованное лично с вами время.',
      ]},
      { heading: '3. Цены и оплата', body: [
        'Цены на сайте указаны в евро и включают все применимые налоги. Оплата производится на месте до или во время первого урока пакета, если не согласовано иное.',
        'Мы можем менять опубликованные цены, но никогда — для уже подтверждённой записи.',
      ]},
      { heading: '4. Пробный урок и возврат', body: [
        'Если первый урок пакета вам не подошёл, сообщите об этом до ухода из студии или в течение 24 часов — мы вернём его стоимость полностью. Подробности — в Политике возврата и отмены.',
      ]},
      { heading: '5. Отмена и перенос', body: [
        'Перенести или отменить урок бесплатно можно, предупредив не менее чем за 24 часа. Урок, отменённый позже или пропущенный без предупреждения, может быть засчитан как проведённый.',
        'Если урок отменяем мы, вы выбираете между новым временем и полным возвратом стоимости этого урока.',
      ]},
      { heading: '6. Правила студии и оборудование', body: [
        'Оборудованием следует пользоваться согласно инструкциям. Вы несёте ответственность за ущерб, причинённый умышленно или по грубой неосторожности. Посещение в состоянии алкогольного или наркотического опьянения не допускается; в таком случае урок может быть прекращён без возврата средств.',
      ]},
      { heading: '7. Записи и фотографии', body: [
        'Выступления на 4-м шаге записываются, чтобы у вас осталось портфолио. Публикуем записи, фото или видео с вами только с вашего отдельного явного согласия, которое можно отозвать в любой момент.',
      ]},
      { heading: '8. Интеллектуальная собственность', body: [
        'Учебные материалы, сайт и его содержимое принадлежат нам и предоставляются для вашего личного обучения. Их нельзя перепродавать, публиковать заново или использовать для проведения конкурирующих курсов.',
      ]},
      { heading: '9. Право на отказ (дистанционный договор)', body: [
        'Если договор заключён дистанционно, потребитель в ЕС вправе отказаться от него в течение 14 дней без объяснения причин. Если вы попросили начать уроки в этот срок, вы оплачиваете пропорциональную стоимость уже проведённых уроков. Для отказа напишите на ' + email + '.',
        'Потребители также могут воспользоваться платформой онлайн-урегулирования споров Еврокомиссии: https://ec.europa.eu/consumers/odr',
      ]},
      { heading: '10. Ответственность', body: [
        'Мы оказываем услуги профессионально и добросовестно. Мы не отвечаем за косвенные убытки и за такие результаты, как получение выступлений или карьерный успех, — они зависят от множества факторов вне нашего контроля. Ничто в этих условиях не ограничивает ответственность, которую нельзя ограничить по закону, включая ответственность за вред жизни и здоровью.',
      ]},
      { heading: '11. Применимое право', body: [
        'Применяется право Литовской Республики. Споры рассматриваются судами Литвы; это не затрагивает право потребителя обратиться в суд по месту своего жительства.',
        `Последнее обновление: ${LEGAL.lastUpdated}.`,
      ]},
    ],
    lt: [
      { heading: '1. Paslaugų teikėjas', body: [
        `${legalName}, ${address}${LEGAL.companyCode ? `, įmonės kodas ${LEGAL.companyCode}` : ''}. El. paštas ${email}, telefonas ${phone}.`,
        `Atstovauja direktorė ${director}. Įregistruota ${LEGAL.registeredOn}.`,
      ]},
      { heading: '2. Registracija', body: [
        'Formos pateikimas yra užklausa, o ne patvirtinta rezervacija. Pamoka laikoma rezervuota tik kai patvirtiname datą ir laiką el. paštu arba telefonu, paprastai per 24 valandas.',
        'Pamokos vyksta mūsų studijoje darbo dienomis (pirmadienį–penktadienį) darbo valandomis, individualiai su jumis suderintu laiku.',
      ]},
      { heading: '3. Kainos ir mokėjimas', body: [
        'Svetainėje nurodytos kainos yra eurais ir apima visus taikomus mokesčius. Mokama vietoje prieš pirmąją paketo pamoką arba jos metu, nebent susitarta kitaip.',
        'Skelbiamas kainas galime keisti, tačiau niekada – jau patvirtintai registracijai.',
      ]},
      { heading: '4. Bandomoji pamoka ir grąžinimas', body: [
        'Jei pirmoji paketo pamoka jums netiko, pasakykite prieš išeidami iš studijos arba per 24 valandas – grąžiname visą jos kainą. Išsamios taisyklės – Grąžinimo ir atšaukimo politikoje.',
      ]},
      { heading: '5. Atšaukimas ir perkėlimas', body: [
        'Pamoką galite nemokamai perkelti arba atšaukti įspėję ne vėliau kaip prieš 24 valandas. Vėliau atšaukta arba neatvykus praleista pamoka gali būti laikoma panaudota.',
        'Jei pamoką tenka atšaukti mums, jūs pasirenkate naują laiką arba visos tos pamokos kainos grąžinimą.',
      ]},
      { heading: '6. Studijos taisyklės ir įranga', body: [
        'Įranga naudojamasi pagal nurodymus. Atsakote už žalą, padarytą tyčia ar dėl didelio neatsargumo. Lankytis apsvaigus nuo alkoholio ar narkotinių medžiagų draudžiama; tokiu atveju pamoka gali būti nutraukta negrąžinant pinigų.',
      ]},
      { heading: '7. Įrašai ir nuotraukos', body: [
        '4-o žingsnio pasirodymai įrašomi, kad gautumėte portfolio įrašą. Įrašus, nuotraukas ar vaizdo medžiagą su jumis skelbiame tik gavę atskirą aiškų jūsų sutikimą, kurį bet kada galite atšaukti.',
      ]},
      { heading: '8. Intelektinė nuosavybė', body: [
        'Mokymo medžiaga, ši svetainė ir jos turinys priklauso mums ir teikiami asmeniniam jūsų mokymuisi. Jų negalima perparduoti, skelbti iš naujo ar naudoti konkuruojantiems kursams vesti.',
      ]},
      { heading: '9. Teisė atsisakyti sutarties (nuotolinė sutartis)', body: [
        'Kai sutartis sudaroma nuotoliniu būdu, ES vartotojas gali jos atsisakyti per 14 dienų nenurodydamas priežasties. Jei paprašėte pradėti pamokas per šį laikotarpį, sumokate proporcingą jau suteiktų pamokų kainą. Norėdami atsisakyti, rašykite ' + email + '.',
        'Vartotojai taip pat gali naudotis Europos Komisijos elektronine ginčų sprendimo platforma: https://ec.europa.eu/consumers/odr',
      ]},
      { heading: '10. Atsakomybė', body: [
        'Paslaugas teikiame profesionaliai ir rūpestingai. Neatsakome už netiesioginius nuostolius ar rezultatus, tokius kaip pasirodymai ar karjeros sėkmė, – jie priklauso nuo daugelio nuo mūsų nepriklausančių veiksnių. Jokia šių sąlygų nuostata neriboja atsakomybės, kurios pagal įstatymus riboti negalima, įskaitant atsakomybę už žalą gyvybei ar sveikatai.',
      ]},
      { heading: '11. Taikoma teisė', body: [
        'Taikoma Lietuvos Respublikos teisė. Ginčai sprendžiami Lietuvos Respublikos teismuose, nepažeidžiant vartotojo teisės kreiptis į savo gyvenamosios vietos teismą.',
        `Paskutinį kartą atnaujinta: ${LEGAL.lastUpdated}.`,
      ]},
    ],
  },
}

/* ── Cookie Policy ─────────────────────────────────────────────────────── */
const cookies: LegalPage = {
  path: '/cookies',
  title: { en: 'Cookie Policy', ru: 'Политика использования cookie', lt: 'Slapukų politika' },
  intro: {
    en: 'This website uses no advertising, analytics or tracking cookies. Below is everything that is actually stored in your browser.',
    ru: 'Этот сайт не использует рекламные, аналитические и трекинговые cookie. Ниже — всё, что действительно сохраняется в вашем браузере.',
    lt: 'Ši svetainė nenaudoja reklamos, analitikos ar sekimo slapukų. Žemiau – viskas, kas iš tikrųjų saugoma jūsų naršyklėje.',
  },
  sections: {
    en: [
      { heading: '1. Strictly necessary storage', body: [
        '• Language preference — remembers the language you selected so the site opens in it next time.',
        '• Administration session — only for the studio owner: a short-lived token stored after logging in to the booking administration area. It expires automatically and is removed on logout.',
        'These are essential for the site to work as you expect and therefore do not require consent under the ePrivacy rules.',
      ]},
      { heading: '2. No tracking', body: [
        'We do not use Google Analytics, Meta Pixel, advertising cookies or any cross-site tracking. We do not build profiles of visitors and we do not share browsing data with advertisers.',
      ]},
      { heading: '3. Third-party requests', body: [
        'Fonts are loaded from Google Fonts when the page opens. Google receives your IP address as part of that request. No cookie is set by us for this. If you would rather avoid it, we can host the fonts ourselves — just ask.',
      ]},
      { heading: '4. Managing storage', body: [
        'You can clear or block cookies and local storage in your browser settings at any time. Blocking them only means the site will forget your language choice.',
        `Questions: ${email}. Last updated: ${LEGAL.lastUpdated}.`,
      ]},
    ],
    ru: [
      { heading: '1. Строго необходимые данные', body: [
        '• Выбор языка — запоминает выбранный вами язык, чтобы сайт открылся на нём в следующий раз.',
        '• Сессия администрирования — только для владельца студии: краткоживущий токен, сохраняемый после входа в панель заявок. Срок его действия истекает автоматически, при выходе он удаляется.',
        'Эти данные необходимы для работы сайта, поэтому согласия по правилам ePrivacy не требуют.',
      ]},
      { heading: '2. Никакого отслеживания', body: [
        'Мы не используем Google Analytics, Meta Pixel, рекламные cookie и любые межсайтовые трекеры. Мы не составляем профили посетителей и не передаём данные о просмотрах рекламодателям.',
      ]},
      { heading: '3. Сторонние запросы', body: [
        'Шрифты загружаются из Google Fonts при открытии страницы. В рамках этого запроса Google получает ваш IP-адрес. Никаких cookie мы при этом не устанавливаем. Если хотите этого избежать, мы можем разместить шрифты локально — просто напишите нам.',
      ]},
      { heading: '4. Управление хранением', body: [
        'Вы можете в любой момент очистить или заблокировать cookie и локальное хранилище в настройках браузера. Блокировка приведёт лишь к тому, что сайт забудет выбранный язык.',
        `Вопросы: ${email}. Последнее обновление: ${LEGAL.lastUpdated}.`,
      ]},
    ],
    lt: [
      { heading: '1. Būtinieji duomenys', body: [
        '• Kalbos pasirinkimas — įsimena jūsų pasirinktą kalbą, kad kitą kartą svetainė atsidarytų ta pačia kalba.',
        '• Administravimo seansas — tik studijos savininkui: trumpalaikis raktas, išsaugomas prisijungus prie registracijų administravimo srities. Jis automatiškai nustoja galioti ir pašalinamas atsijungus.',
        'Šie duomenys būtini svetainės veikimui, todėl pagal ePrivacy taisykles sutikimo nereikalauja.',
      ]},
      { heading: '2. Jokio sekimo', body: [
        'Nenaudojame Google Analytics, Meta Pixel, reklamos slapukų ar kito sekimo tarp svetainių. Lankytojų profilių nekuriame ir naršymo duomenų reklamuotojams neperduodame.',
      ]},
      { heading: '3. Trečiųjų šalių užklausos', body: [
        'Atidarius puslapį šriftai atsiunčiami iš Google Fonts. Su šia užklausa Google gauna jūsų IP adresą. Jokių slapukų mes dėl to nenustatome. Jei norite to išvengti, galime šriftus talpinti savo serveryje – tiesiog parašykite.',
      ]},
      { heading: '4. Duomenų valdymas', body: [
        'Bet kada galite išvalyti ar blokuoti slapukus ir vietinę saugyklą naršyklės nustatymuose. Užblokavus svetainė tiesiog pamirš jūsų pasirinktą kalbą.',
        `Klausimai: ${email}. Paskutinį kartą atnaujinta: ${LEGAL.lastUpdated}.`,
      ]},
    ],
  },
}

/* ── Refund & Cancellation Policy ──────────────────────────────────────── */
const refunds: LegalPage = {
  path: '/refunds',
  title: { en: 'Refund & Cancellation Policy', ru: 'Политика возврата и отмены', lt: 'Grąžinimo ir atšaukimo politika' },
  intro: {
    en: 'How cancellations, rescheduling and refunds work. This policy is part of our Terms of Service.',
    ru: 'Как работают отмена, перенос и возврат средств. Эта политика является частью Условий оказания услуг.',
    lt: 'Kaip veikia atšaukimas, perkėlimas ir pinigų grąžinimas. Ši politika yra Paslaugų teikimo sąlygų dalis.',
  },
  sections: {
    en: [
      { heading: '1. Trial lesson guarantee', body: [
        'If the first lesson of any package is not right for you, tell us before you leave the studio or within 24 hours of it. We refund that lesson in full, no questions asked.',
      ]},
      { heading: '2. Cancelling or moving a lesson', body: [
        'Free of charge with at least 24 hours’ notice. With less notice, or if you do not attend, the lesson may be counted as used. We always try to be reasonable about illness and emergencies.',
      ]},
      { heading: '3. Stopping a package part-way', body: [
        'You can stop at any time. We refund the lessons you have not yet taken, minus any discount that applied only because you bought the full package.',
      ]},
      { heading: '4. Cancellations by us', body: [
        'If we cancel a lesson, you choose between a new time and a full refund for that lesson.',
      ]},
      { heading: '5. 14-day right of withdrawal', body: [
        'For contracts concluded remotely, consumers may withdraw within 14 days without giving a reason. If lessons started at your request during that period, a proportionate amount for the lessons delivered is due.',
      ]},
      { heading: '6. How to request a refund', body: [
        `Write to ${email} or call ${phone} with your name, the date of the lesson and your bank details. Refunds are returned by the same payment method where possible, within 14 days of us agreeing to the refund.`,
        `Last updated: ${LEGAL.lastUpdated}.`,
      ]},
    ],
    ru: [
      { heading: '1. Гарантия пробного урока', body: [
        'Если первый урок любого пакета вам не подошёл, скажите нам до ухода из студии или в течение 24 часов после него. Мы вернём стоимость этого урока полностью и без вопросов.',
      ]},
      { heading: '2. Отмена и перенос урока', body: [
        'Бесплатно при предупреждении не менее чем за 24 часа. При более позднем предупреждении или неявке урок может быть засчитан как проведённый. В случае болезни или форс-мажора мы всегда идём навстречу.',
      ]},
      { heading: '3. Прекращение пакета на середине', body: [
        'Прекратить занятия можно в любой момент. Мы возвращаем стоимость непройденных уроков за вычетом скидки, которая действовала только из-за покупки полного пакета.',
      ]},
      { heading: '4. Отмена с нашей стороны', body: [
        'Если урок отменяем мы, вы выбираете новое время или полный возврат стоимости этого урока.',
      ]},
      { heading: '5. Право на отказ в течение 14 дней', body: [
        'При дистанционном заключении договора потребитель вправе отказаться от него в течение 14 дней без объяснения причин. Если по вашей просьбе уроки начались в этот период, оплачивается пропорциональная стоимость проведённых уроков.',
      ]},
      { heading: '6. Как запросить возврат', body: [
        `Напишите на ${email} или позвоните ${phone}, указав имя, дату урока и банковские реквизиты. Возврат выполняется тем же способом оплаты, если это возможно, в течение 14 дней с момента согласования.`,
        `Последнее обновление: ${LEGAL.lastUpdated}.`,
      ]},
    ],
    lt: [
      { heading: '1. Bandomosios pamokos garantija', body: [
        'Jei pirmoji bet kurio paketo pamoka jums netiko, pasakykite prieš išeidami iš studijos arba per 24 valandas po jos. Grąžiname visą tos pamokos kainą be jokių klausimų.',
      ]},
      { heading: '2. Pamokos atšaukimas ar perkėlimas', body: [
        'Nemokamai įspėjus ne vėliau kaip prieš 24 valandas. Įspėjus vėliau arba neatvykus pamoka gali būti laikoma panaudota. Ligos ar nenumatytų aplinkybių atveju visada stengiamės susitarti.',
      ]},
      { heading: '3. Paketo nutraukimas pusiaukelėje', body: [
        'Nutraukti galite bet kada. Grąžiname už dar nepanaudotas pamokas, atskaičiavę nuolaidą, kuri galiojo tik dėl viso paketo įsigijimo.',
      ]},
      { heading: '4. Kai atšaukiame mes', body: [
        'Jei pamoką atšaukiame mes, jūs pasirenkate naują laiką arba visos tos pamokos kainos grąžinimą.',
      ]},
      { heading: '5. 14 dienų teisė atsisakyti sutarties', body: [
        'Nuotoliniu būdu sudarytos sutarties vartotojas gali atsisakyti per 14 dienų nenurodydamas priežasties. Jei jūsų prašymu pamokos prasidėjo per šį laikotarpį, mokama proporcinga jau suteiktų pamokų kaina.',
      ]},
      { heading: '6. Kaip prašyti grąžinimo', body: [
        `Rašykite ${email} arba skambinkite ${phone} nurodydami vardą, pamokos datą ir banko sąskaitos duomenis. Pinigus grąžiname tuo pačiu mokėjimo būdu, kai tai įmanoma, per 14 dienų nuo susitarimo.`,
        `Paskutinį kartą atnaujinta: ${LEGAL.lastUpdated}.`,
      ]},
    ],
  },
}

export const LEGAL_PAGES: LegalPage[] = [privacy, terms, cookies, refunds]

export function findLegalPage(path: string): LegalPage | undefined {
  return LEGAL_PAGES.find(p => p.path === path)
}
