---
title: Каналы уведомлений
concept: Итог модуля — протоколы, умолчания, any, внедрение зависимостей
---

## @description

### Контекст
Финальная задача модуля. Когда приходит новое сообщение, «Почтальон» должен сообщить об этом человеку. Способов несколько: push, если приложение установлено, и SMS, если указан номер. Скоро добавятся часы, почта и голосовой помощник.

Коллеги уже написали два канала — `PushChannel` и `SMSChannel`, — но под протокол, которого пока нет. Тимлид поручает тебе остальное: «Опиши протокол канала, дай ему поведение по умолчанию и собери сервис, который пробует каналы по очереди. Только сервис не должен сам решать, какие каналы бывают. Пусть получает их снаружи: на телефоне один набор, на часах другой, а в тестах — поддельные каналы».

### Что пригодится
**Протокол и его требования.** Свойство с `{ get }`, методы без тел. Выполнить требование `var name: String { get }` можно и через `let name = "Push"`.

**Поведение по умолчанию.** Метод, который есть и в требованиях протокола, и в `extension` протокола, достаётся всем типам. Тип может написать свою версию, и через `any` вызовется именно она — но только если метод есть в списке требований.

**Протокол как тип.** `[any NotificationChannel]` — массив любых каналов. Через `any` видно только то, что обещал протокол.

**`CustomStringConvertible`.** Свойство `description` превращает значение в текст для `print` и интерполяции.

**Внедрение зависимостей.** Это не новая конструкция Swift, а приём, собранный из того, что ты уже знаешь. Зависимость — то, без чего объект не может работать: сервису уведомлений нужны каналы. Внедрить — значит передать снаружи, а не создавать внутри. Сравни:

```swift
// Сам создаёт зависимость: всегда один и тот же сканер
class PhotoChecker {
    let scanner = FaceScanner()
}

// Получает зависимость снаружи: какой сканер дали, с тем и работает
class PhotoChecker {
    let scanner: any Scanner

    init(scanner: any Scanner) {
        self.scanner = scanner
    }
}
```

Второй вариант гибче. Один и тот же класс работает с разными сканерами, которые подписаны на протокол `Scanner`. А в тестах вместо настоящего сканера можно подставить поддельный, который ничего не сканирует, а только записывает, что его вызвали. Именно так проверка поступит с твоим сервисом.

### Задача
В редакторе есть структура `Contact` и два готовых канала. Их не меняй.

1. Объяви протокол `NotificationChannel` с тремя требованиями:
   - свойство `name` типа `String`, только для чтения;
   - метод `canReach(_:)`: параметр `Contact` без метки, возвращает `Bool`;
   - метод `deliver(_:to:)`: текст `String` без метки и `Contact` с меткой `to`, возвращает `String`.
2. Напиши расширение протокола: по умолчанию `deliver` возвращает имя канала, двоеточие, пробел и текст. `PushChannel` пользуется этим умолчанием, а у `SMSChannel` своя версия.
3. Объяви класс `NotificationService`, подписанный на `CustomStringConvertible`:
   - свойство `channels` типа `[any NotificationChannel]` и инициализатор `init(channels:)`, который его заполняет;
   - свойство `deliveredCount` типа `Int`, вначале `0`;
   - метод `notify(_:text:)`: параметр `Contact` без метки и `text` типа `String`, возвращает `String`. Если у контакта включён режим «Не беспокоить» — сразу `Не беспокоить: уведомление отложено`, каналы не трогаем. Иначе каналы перебираются по порядку: первый, который может достучаться до контакта, доставляет текст, метод возвращает результат его `deliver`, а `deliveredCount` растёт на 1. Если не подошёл ни один — `Нет доступных каналов`;
   - `description` возвращает `Сервис уведомлений, каналов: ` и их количество.

Каналы сервис получает только через `init` — сам он их не создаёт.

### Пример
Сценарий внизу редактора должен вывести:

```text
Сервис уведомлений, каналов: 2
Билол - Push: Новое сообщение в чате Семья
Мама - SMS на номер +7 900 555-66-77: у вас новое сообщение в Почтальоне
Сестра - Не беспокоить: уведомление отложено
Соседка - Нет доступных каналов
Доставлено: 2
Сервис уведомлений, каналов: 1
Часы, Билол - Push: Ужин готов
Часы, мама - Нет доступных каналов
```

## @starter
```swift
// Контакт, которому нужно доставить уведомление
struct Contact {
    let name: String
    let hasApp: Bool          // установлен ли "Почтальон": нужен для push
    let phone: String?        // номер для SMS, может быть не указан
    let isDoNotDisturb: Bool  // включён режим "Не беспокоить"
}

// 1. Протокол канала доставки: name, canReach(_:), deliver(_:to:)


// 2. Поведение по умолчанию: deliver возвращает "имя канала: текст"


// Каналы уже написали коллеги. Они заработают, когда появится протокол
struct PushChannel: NotificationChannel {
    let name = "Push"

    func canReach(_ contact: Contact) -> Bool {
        return contact.hasApp
    }
}

struct SMSChannel: NotificationChannel {
    let name = "SMS"

    func canReach(_ contact: Contact) -> Bool {
        return contact.phone != nil
    }

    // Текст сообщения в SMS не пишем: его могут увидеть на экране блокировки
    func deliver(_ text: String, to contact: Contact) -> String {
        return "SMS на номер \(contact.phone ?? "не указан"): у вас новое сообщение в Почтальоне"
    }
}

// 3. Сервис уведомлений: каналы получает снаружи, через init


// Контакты
let bilol = Contact(name: "Билол", hasApp: true, phone: "+7 900 111-22-33", isDoNotDisturb: false)
let mom = Contact(name: "Мама", hasApp: false, phone: "+7 900 555-66-77", isDoNotDisturb: false)
let sister = Contact(name: "Сестра", hasApp: true, phone: nil, isDoNotDisturb: true)
let neighbor = Contact(name: "Соседка", hasApp: false, phone: nil, isDoNotDisturb: false)

// Телефон: сначала push, потом SMS
let phoneService = NotificationService(channels: [PushChannel(), SMSChannel()])
print(phoneService)
for contact in [bilol, mom, sister, neighbor] {
    print("\(contact.name) - \(phoneService.notify(contact, text: "Новое сообщение в чате Семья"))")
}
print("Доставлено: \(phoneService.deliveredCount)")

// Часы: только push
let watchService = NotificationService(channels: [PushChannel()])
print(watchService)
print("Часы, Билол - \(watchService.notify(bilol, text: "Ужин готов"))")
print("Часы, мама - \(watchService.notify(mom, text: "Ужин готов"))")
```

## @solution
```swift
// Контакт, которому нужно доставить уведомление
struct Contact {
    let name: String
    let hasApp: Bool          // установлен ли "Почтальон": нужен для push
    let phone: String?        // номер для SMS, может быть не указан
    let isDoNotDisturb: Bool  // включён режим "Не беспокоить"
}

// 1. Протокол канала доставки: name, canReach(_:), deliver(_:to:)
protocol NotificationChannel {
    var name: String { get }
    func canReach(_ contact: Contact) -> Bool
    func deliver(_ text: String, to contact: Contact) -> String
}

// 2. Поведение по умолчанию: deliver возвращает "имя канала: текст"
extension NotificationChannel {
    func deliver(_ text: String, to contact: Contact) -> String {
        return "\(name): \(text)"
    }
}

// Каналы уже написали коллеги. Они заработают, когда появится протокол
struct PushChannel: NotificationChannel {
    let name = "Push"

    func canReach(_ contact: Contact) -> Bool {
        return contact.hasApp
    }
}

struct SMSChannel: NotificationChannel {
    let name = "SMS"

    func canReach(_ contact: Contact) -> Bool {
        return contact.phone != nil
    }

    // Текст сообщения в SMS не пишем: его могут увидеть на экране блокировки
    func deliver(_ text: String, to contact: Contact) -> String {
        return "SMS на номер \(contact.phone ?? "не указан"): у вас новое сообщение в Почтальоне"
    }
}

// 3. Сервис уведомлений: каналы получает снаружи, через init
class NotificationService: CustomStringConvertible {
    let channels: [any NotificationChannel]
    var deliveredCount = 0

    init(channels: [any NotificationChannel]) {
        self.channels = channels
    }

    var description: String {
        return "Сервис уведомлений, каналов: \(channels.count)"
    }

    func notify(_ contact: Contact, text: String) -> String {
        if contact.isDoNotDisturb {
            return "Не беспокоить: уведомление отложено"
        }
        for channel in channels {
            if channel.canReach(contact) {
                deliveredCount += 1
                return channel.deliver(text, to: contact)
            }
        }
        return "Нет доступных каналов"
    }
}

// Контакты
let bilol = Contact(name: "Билол", hasApp: true, phone: "+7 900 111-22-33", isDoNotDisturb: false)
let mom = Contact(name: "Мама", hasApp: false, phone: "+7 900 555-66-77", isDoNotDisturb: false)
let sister = Contact(name: "Сестра", hasApp: true, phone: nil, isDoNotDisturb: true)
let neighbor = Contact(name: "Соседка", hasApp: false, phone: nil, isDoNotDisturb: false)

// Телефон: сначала push, потом SMS
let phoneService = NotificationService(channels: [PushChannel(), SMSChannel()])
print(phoneService)
for contact in [bilol, mom, sister, neighbor] {
    print("\(contact.name) - \(phoneService.notify(contact, text: "Новое сообщение в чате Семья"))")
}
print("Доставлено: \(phoneService.deliveredCount)")

// Часы: только push
let watchService = NotificationService(channels: [PushChannel()])
print(watchService)
print("Часы, Билол - \(watchService.notify(bilol, text: "Ужин готов"))")
print("Часы, мама - \(watchService.notify(mom, text: "Ужин готов"))")
```

## @output
```
Сервис уведомлений, каналов: 2
Билол - Push: Новое сообщение в чате Семья
Мама - SMS на номер +7 900 555-66-77: у вас новое сообщение в Почтальоне
Сестра - Не беспокоить: уведомление отложено
Соседка - Нет доступных каналов
Доставлено: 2
Сервис уведомлений, каналов: 1
Часы, Билол - Push: Ужин готов
Часы, мама - Нет доступных каналов
```

## @tests
```swift
// Поддельный канал: ничего не отправляет, только записывает вызовы
class __t_FakeChannel: NotificationChannel {
    let name: String
    let reachable: Bool
    var delivered: [String] = []

    init(name: String, reachable: Bool) {
        self.name = name
        self.reachable = reachable
    }

    func canReach(_ contact: Contact) -> Bool {
        return reachable
    }

    func deliver(_ text: String, to contact: Contact) -> String {
        delivered.append(text)
        return "\(name) доставил: \(text)"
    }
}

// Канал без своей версии deliver: должен получить умолчание
struct __t_MailChannel: NotificationChannel {
    let name = "Почта"

    func canReach(_ contact: Contact) -> Bool {
        return true
    }
}

let __t_bilol = Contact(name: "Билол", hasApp: true, phone: "+7 900 111-22-33", isDoNotDisturb: false)
let __t_quiet = Contact(name: "Подруга", hasApp: true, phone: "+7 900 777-88-99", isDoNotDisturb: true)
let __t_noApp = Contact(name: "Мама", hasApp: false, phone: "+7 900 555-66-77", isDoNotDisturb: false)
let __t_nobody = Contact(name: "Коллега", hasApp: false, phone: nil, isDoNotDisturb: false)

let __t_mail: any NotificationChannel = __t_MailChannel()
__eq("Умолчание deliver для нового канала: имя канала и текст", __t_mail.deliver("Привет", to: __t_bilol), "Почта: Привет", hint: "В расширении протокола deliver возвращает name, двоеточие, пробел и текст")
let __t_sms: any NotificationChannel = SMSChannel()
__eq("SMS через any NotificationChannel использует свою версию", __t_sms.deliver("Привет", to: __t_noApp), "SMS на номер +7 900 555-66-77: у вас новое сообщение в Почтальоне", hint: "deliver(_:to:) должен быть в списке требований протокола, иначе своя версия SMSChannel не вызывается")

let __t_off = __t_FakeChannel(name: "Часы", reachable: false)
let __t_on = __t_FakeChannel(name: "Планшет", reachable: true)
let __t_spare = __t_FakeChannel(name: "Почта", reachable: true)
let __t_service = NotificationService(channels: [__t_off, __t_on, __t_spare])

__eq("Описание сервиса с тремя каналами", "\(__t_service)", "Сервис уведомлений, каналов: 3", hint: "description возвращает Сервис уведомлений, каналов: и channels.count")
__eq("Сервис хранит переданные каналы", __t_service.channels.map { $0.name }, ["Часы", "Планшет", "Почта"], hint: "В init сохрани переданный массив в свойство channels")
__eq("Вначале доставлено 0", __t_service.deliveredCount, 0)

__eq("Первый недоступен - доставляет второй", __t_service.notify(__t_bilol, text: "Скоро буду"), "Планшет доставил: Скоро буду", hint: "Перебирай каналы по порядку и верни результат deliver первого, у которого canReach даёт true")
__eq("Недоступный канал ничего не доставлял", __t_off.delivered, [])
__eq("Третий канал не понадобился", __t_spare.delivered, [], hint: "Как только канал доставил уведомление, остановись: return сразу после deliver")
__eq("После доставки счётчик равен 1", __t_service.deliveredCount, 1, hint: "При успешной доставке увеличь deliveredCount на 1")

let __t_sentBefore = __t_off.delivered.count + __t_on.delivered.count + __t_spare.delivered.count
let __t_countBefore = __t_service.deliveredCount
__eq("Не беспокоить: уведомление отложено", __t_service.notify(__t_quiet, text: "Ты где?"), "Не беспокоить: уведомление отложено", hint: "Сначала проверь isDoNotDisturb у контакта")
__eq("Не беспокоить: каналы не трогаем", __t_off.delivered.count + __t_on.delivered.count + __t_spare.delivered.count, __t_sentBefore, hint: "Если включён режим Не беспокоить, ни один канал не должен ничего доставлять")
__eq("Не беспокоить: счётчик не растёт", __t_service.deliveredCount, __t_countBefore, hint: "deliveredCount растёт только при настоящей доставке")

let __t_offOnly = NotificationService(channels: [__t_FakeChannel(name: "Часы", reachable: false)])
__eq("Ни один канал не подошёл", __t_offOnly.notify(__t_bilol, text: "Привет"), "Нет доступных каналов", hint: "Если цикл закончился и никто не доставил, верни Нет доступных каналов")
__eq("Ни один канал не подошёл - счётчик 0", __t_offOnly.deliveredCount, 0)
__eq("Сервис использует только переданные каналы", __t_offOnly.notify(__t_bilol, text: "Привет"), "Нет доступных каналов", hint: "Сервис не должен создавать PushChannel или SMSChannel сам: только каналы из init")

let __t_empty = NotificationService(channels: [])
__eq("Сервис без каналов", __t_empty.notify(__t_bilol, text: "Привет"), "Нет доступных каналов")
__eq("Описание сервиса без каналов", "\(__t_empty)", "Сервис уведомлений, каналов: 0")

let __t_first = __t_FakeChannel(name: "Первый", reachable: true)
let __t_second = __t_FakeChannel(name: "Второй", reachable: true)
let __t_ordered = NotificationService(channels: [__t_first, __t_second])
__eq("Оба канала доступны - доставляет первый", __t_ordered.notify(__t_nobody, text: "Обед в 13:00"), "Первый доставил: Обед в 13:00", hint: "Порядок каналов важен: пробуй их в том порядке, в каком они лежат в массиве")
_ = __t_ordered.notify(__t_nobody, text: "Обед переносится")
__eq("Две доставки - счётчик 2", __t_ordered.deliveredCount, 2)

let __t_real = NotificationService(channels: [PushChannel(), SMSChannel()])
__eq("Настоящие каналы: нет приложения - уходит SMS", __t_real.notify(__t_noApp, text: "Привет"), "SMS на номер +7 900 555-66-77: у вас новое сообщение в Почтальоне")
__eq("Настоящие каналы: есть приложение - push", __t_real.notify(__t_bilol, text: "Привет"), "Push: Привет")
__eq("Настоящие каналы: ни приложения, ни номера", __t_real.notify(__t_nobody, text: "Привет"), "Нет доступных каналов")
let __t_smsFirst = NotificationService(channels: [SMSChannel(), PushChannel()])
__eq("Сначала SMS, потом push: у Билола есть номер - уходит SMS", __t_smsFirst.notify(__t_bilol, text: "Привет"), "SMS на номер +7 900 111-22-33: у вас новое сообщение в Почтальоне", hint: "Не выбирай канал по имени: пробуй их в порядке массива channels")
```

## @rules
- must: /\bprotocol\s+NotificationChannel\b/ :: Объяви протокол `NotificationChannel`.
- must: /\bextension\s+NotificationChannel\b/ :: Поведение по умолчанию для `deliver` напиши в расширении протокола: `extension NotificationChannel { ... }`.
- must: /\[\s*any\s+NotificationChannel\s*\]/ :: Каналы храни в массиве типа `[any NotificationChannel]`.
- must: /\binit\s*\(\s*channels\s*:/ :: Каналы сервис получает снаружи: `init(channels: [any NotificationChannel])`.

## @hint1
Начни с протокола: если он описан верно, каналы коллег сразу соберутся. Посмотри на `PushChannel` и `SMSChannel` — по ним видно, какие имена, параметры и метки ждут от протокола. В протоколе три строки: свойство с `{ get }` и две первые строки методов без тел.

Затем расширение протокола с одним методом `deliver(_:to:)`, уже с телом: строка из `name` и текста.

Сервис — класс, подписанный на `CustomStringConvertible`. В нём два свойства: массив каналов без начального значения и счётчик с нулём. Массив заполняет `init` из своего параметра — тут пригодится `self`.

В `notify` первым делом проверь режим «Не беспокоить» и сразу верни нужный текст. Потом цикл по каналам: если канал может достучаться до контакта, увеличь счётчик и сразу верни результат его `deliver`. Если цикл закончился, а возврата не было, — верни текст про отсутствие каналов.

`description` — вычисляемое свойство с количеством каналов.

## @hint2
Ключевые части на примере сканера фотографий:

```swift
protocol Scanner {
    var title: String { get }
    func scan(_ photo: String) -> String
}

extension Scanner {
    func scan(_ photo: String) -> String {
        return "\(title): \(photo)"
    }
}

class PhotoChecker {
    let scanners: [any Scanner]

    init(scanners: [any Scanner]) {
        self.scanners = scanners
    }
}
```

А перебор с ранним выходом выглядит так: внутри `for` стоит `if`, а в нём `return`. Если ни разу не вернулись — после цикла идёт запасной `return`.

## @hint3
Протокол и расширение готовы. Заполни пропуски в сервисе:

```swift
protocol NotificationChannel {
    var name: String { get }
    func canReach(_ contact: Contact) -> Bool
    func deliver(_ text: String, to contact: Contact) -> String
}

extension NotificationChannel {
    func deliver(_ text: String, to contact: Contact) -> String {
        return "\(name): \(text)"
    }
}

class NotificationService: CustomStringConvertible {
    let channels: [any NotificationChannel]
    var deliveredCount = 0

    init(channels: [any NotificationChannel]) {
        ___
    }

    var description: String {
        return "Сервис уведомлений, каналов: \(channels.count)"
    }

    func notify(_ contact: Contact, text: String) -> String {
        if ___ {
            return "Не беспокоить: уведомление отложено"
        }
        for channel in channels {
            if channel.canReach(contact) {
                deliveredCount += 1
                return ___
            }
        }
        return "Нет доступных каналов"
    }
}
```

В первом пропуске — сохранение параметра в свойство. Во втором — проверка режима «Не беспокоить» у контакта. В третьем — вызов `deliver` у найденного канала.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** Протокол `NotificationChannel` — договор, под который коллеги уже написали каналы: имя, «могу ли достучаться» и «доставь». Расширение даёт `deliver` по умолчанию, и `PushChannel` пользуется им, ничего не написав. `SMSChannel` пишет свою версию, и через `any NotificationChannel` вызывается именно она, потому что `deliver` есть в списке требований.

`NotificationService` получает каналы в `init` и хранит их как `[any NotificationChannel]`. `notify` сначала уважает режим «Не беспокоить», потом идёт по каналам в том порядке, в каком их передали. Первый подходящий доставляет уведомление, и `return` сразу заканчивает метод — остальные каналы не тревожатся. Счётчик растёт только при настоящей доставке.

**Зачем внедрять каналы снаружи.** На телефоне сервис работает с push и SMS, на часах — только с push, и это один и тот же класс. А проверка подставила поддельные каналы, которые ничего не отправляют, а записывают вызовы. Так она убедилась, что недоступный канал не трогали, лишний не тревожили, а в режиме «Не беспокоить» не беспокоили никого. Будь каналы созданы внутри сервиса, ничего этого проверить было бы нельзя.

**Что здесь из всего модуля.** Протокол с требованиями свойства и методов, реализация по умолчанию в расширении протокола, массив `any`, `CustomStringConvertible` — и всё это соединено приёмом, на котором держится архитектура больших приложений.

**Типичные ошибки:**

- `deliveredCount += 1` после `return` — до этой строки выполнение уже не дойдёт, и Swift предупредит о недостижимом коде;
- нет `return` внутри цикла — сервис доставит уведомление через все доступные каналы, а вернёт текст последнего;
- `deliver` объявлен только в расширении, без требования в протоколе, — SMS начнёт присылать текст сообщения, нарушая приватность;
- внутри сервиса создаются `PushChannel()` и `SMSChannel()` — тогда каналы, переданные в `init`, ни на что не влияют.
