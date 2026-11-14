---
title: Понятные логи
concept: CustomStringConvertible и description, Identifiable и id
---

## @description

### Контекст
В поддержку «Почтальона» пришла жалоба: «Пишу в чат "Семья", а сообщения уходят не туда». Разработчики открыли логи и увидели вот это:

```text
Chat(id: 31, title: "Семья", unreadCount: 1)
read
```

Понять можно, но с трудом, а поддержка читает логи по-русски. Выяснилось и другое: у пользователя два чата с названием «Семья», и один экран искал чат по названию. Тимлид ставит две задачи: «Научи чат и статус доставки печатать себя по-человечески. И давай искать чаты только по `id` — название может повторяться и меняться».

### Новое в Swift
**`CustomStringConvertible` — «умею описать себя текстом».** У протокола одно требование: свойство `description` типа `String`. Когда значение такого типа попадает в `print` или в интерполяцию `\( )`, Swift берёт текст из `description`.

```swift
struct Sticker {
    let pack: String
    let number: Int
}

print(Sticker(pack: "Коты", number: 4))
// Sticker(pack: "Коты", number: 4)
```

Так Swift печатает структуру по умолчанию: удобно программисту, но не человеку. Подпишем тип на протокол:

```swift
struct Sticker: CustomStringConvertible {
    let pack: String
    let number: Int

    var description: String {
        return "Стикер \(number) из набора \(pack)"
    }
}

let sticker = Sticker(pack: "Коты", number: 4)
print(sticker)                    // Стикер 4 из набора Коты
print("Отправлен: \(sticker)")    // Отправлен: Стикер 4 из набора Коты
```

Перечисления тоже можно подписать: внутри `description` удобно использовать `switch self`.

**`Identifiable` — «у меня есть постоянный номер».** Требование тоже одно: свойство `id`. Тип `id` может быть любым, лишь бы значения можно было сравнивать и класть в `Set` — `Int`, `String` и так далее. Главное — смысл: `id` уникален и **не меняется** за всю жизнь значения. Название папки можно переименовать, две папки могут называться одинаково, а `id` у каждой свой и навсегда:

```swift
struct Folder: Identifiable {
    let id: String
    var name: String
}
```

Если у типа уже есть подходящее свойство `id`, достаточно подписи — писать ничего не нужно. В приложениях для iPhone `Identifiable` нужен постоянно: SwiftUI с его помощью понимает, какая строка списка какому элементу принадлежит. А в своём коде по `id` ищут, обновляют и удаляют элементы.

### Задача
1. Подпиши `DeliveryStatus` на `CustomStringConvertible`. Свойство `description` возвращает: `sending` — `отправляется`, `sent` — `отправлено`, `delivered` — `доставлено`, `read` — `прочитано`.
2. Подпиши `Chat` на `Identifiable` и `CustomStringConvertible`. Свойство `id` у чата уже есть. Свойство `description` возвращает `Чат 7: Семья, непрочитанных: 3` — номер, название и число непрочитанных. Если непрочитанных нет — только `Чат 7: Семья`.
3. Напиши функцию `findChat(id:in:)`. Параметры: `id` типа `Int` и массив `[Chat]` с меткой `in`. Возвращает `Chat?` — чат с таким `id` или `nil`, если его нет. Ищи только по `id`.
4. Напиши функцию `logLine(for:status:)`. Параметры: чат с меткой `for` и `DeliveryStatus` с меткой `status`. Возвращает строку: описание чата, точка, пробел и `Последнее сообщение: ` с описанием статуса. Собери её интерполяцией самих значений — не вызывай `description` вручную.

### Пример
Сценарий внизу редактора должен вывести:

```text
Чат 7: Семья, непрочитанных: 3
Чат 12: Книжный клуб
Чат 31: Семья, непрочитанных: 1
Чат 31: Семья, непрочитанных: 1. Последнее сообщение: прочитано
Статус нового сообщения: отправляется
```

## @starter
```swift
// 1. Подпиши на CustomStringConvertible и напиши description
enum DeliveryStatus {
    case sending
    case sent
    case delivered
    case read
}

// 2. Подпиши на Identifiable и CustomStringConvertible и напиши description
struct Chat {
    let id: Int
    var title: String
    var unreadCount: Int
}

// 3. Поиск чата по id


// 4. Строка для лога: чат и статус последнего сообщения


// Чаты пользователя: два из них называются одинаково
let chats = [
    Chat(id: 7, title: "Семья", unreadCount: 3),
    Chat(id: 12, title: "Книжный клуб", unreadCount: 0),
    Chat(id: 31, title: "Семья", unreadCount: 1)
]
for chat in chats {
    print(chat)
}
if let found = findChat(id: 31, in: chats) {
    print(logLine(for: found, status: .read))
}
print("Статус нового сообщения: \(DeliveryStatus.sending)")
```

## @solution
```swift
// 1. Подпиши на CustomStringConvertible и напиши description
enum DeliveryStatus: CustomStringConvertible {
    case sending
    case sent
    case delivered
    case read

    var description: String {
        switch self {
        case .sending:
            return "отправляется"
        case .sent:
            return "отправлено"
        case .delivered:
            return "доставлено"
        case .read:
            return "прочитано"
        }
    }
}

// 2. Подпиши на Identifiable и CustomStringConvertible и напиши description
struct Chat: Identifiable, CustomStringConvertible {
    let id: Int
    var title: String
    var unreadCount: Int

    var description: String {
        if unreadCount == 0 {
            return "Чат \(id): \(title)"
        }
        return "Чат \(id): \(title), непрочитанных: \(unreadCount)"
    }
}

// 3. Поиск чата по id
func findChat(id: Int, in chats: [Chat]) -> Chat? {
    return chats.first { $0.id == id }
}

// 4. Строка для лога: чат и статус последнего сообщения
func logLine(for chat: Chat, status: DeliveryStatus) -> String {
    return "\(chat). Последнее сообщение: \(status)"
}

// Чаты пользователя: два из них называются одинаково
let chats = [
    Chat(id: 7, title: "Семья", unreadCount: 3),
    Chat(id: 12, title: "Книжный клуб", unreadCount: 0),
    Chat(id: 31, title: "Семья", unreadCount: 1)
]
for chat in chats {
    print(chat)
}
if let found = findChat(id: 31, in: chats) {
    print(logLine(for: found, status: .read))
}
print("Статус нового сообщения: \(DeliveryStatus.sending)")
```

## @output
```
Чат 7: Семья, непрочитанных: 3
Чат 12: Книжный клуб
Чат 31: Семья, непрочитанных: 1
Чат 31: Семья, непрочитанных: 1. Последнее сообщение: прочитано
Статус нового сообщения: отправляется
```

## @tests
```swift
__ok("Chat подписан на Identifiable", (Chat(id: 1, title: "Тест", unreadCount: 0) as Any) is any Identifiable, hint: "Добавь Identifiable в список протоколов после имени структуры: struct Chat: Identifiable, CustomStringConvertible")
__ok("Chat подписан на CustomStringConvertible", (Chat(id: 1, title: "Тест", unreadCount: 0) as Any) is any CustomStringConvertible, hint: "Добавь CustomStringConvertible в список протоколов после имени структуры")
__ok("DeliveryStatus подписан на CustomStringConvertible", (DeliveryStatus.sent as Any) is any CustomStringConvertible, hint: "Подпиши перечисление: enum DeliveryStatus: CustomStringConvertible")

__eq("Статус sending печатается по-русски", "\(DeliveryStatus.sending)", "отправляется")
__eq("Статус sent печатается по-русски", "\(DeliveryStatus.sent)", "отправлено")
__eq("Статус delivered печатается по-русски", "\(DeliveryStatus.delivered)", "доставлено")
__eq("Статус read печатается по-русски", String(describing: DeliveryStatus.read), "прочитано", hint: "description для read возвращает прочитано")

let __t_work = Chat(id: 105, title: "Рабочий чат", unreadCount: 12)
let __t_one = Chat(id: 8, title: "Подруга", unreadCount: 1)
let __t_quiet = Chat(id: 64, title: "Дача", unreadCount: 0)
__eq("Описание чата с непрочитанными", "\(__t_work)", "Чат 105: Рабочий чат, непрочитанных: 12", hint: "Формат: Чат, пробел, id, двоеточие, пробел, название, запятая, пробел, непрочитанных: и число")
__eq("Описание чата с одним непрочитанным", String(describing: __t_one), "Чат 8: Подруга, непрочитанных: 1", hint: "Одно непрочитанное сообщение - это уже не ноль: число нужно показать")
__eq("Описание чата без непрочитанных", "\(__t_quiet)", "Чат 64: Дача", hint: "Если unreadCount равен 0, верни только Чат, id, двоеточие и название")

var __t_renamed = Chat(id: 64, title: "Дача", unreadCount: 0)
__t_renamed.title = "Дача летом"
__t_renamed.unreadCount = 2
__eq("Описание меняется вместе с данными чата", "\(__t_renamed)", "Чат 64: Дача летом, непрочитанных: 2", hint: "description должен быть вычисляемым свойством, а не строкой, сохранённой при создании")

let __t_list = [
    Chat(id: 7, title: "Семья", unreadCount: 3),
    __t_work,
    Chat(id: 31, title: "Семья", unreadCount: 1),
    __t_quiet
]
__eq("Поиск по id среди чатов с одинаковым названием: id 31", findChat(id: 31, in: __t_list)?.unreadCount, 1, hint: "Сравнивай id, а не title: два чата называются Семья")
__eq("Поиск по id среди чатов с одинаковым названием: id 7", findChat(id: 7, in: __t_list)?.unreadCount, 3)
__eq("Поиск рабочего чата по id 105", findChat(id: 105, in: __t_list)?.title, "Рабочий чат")
__eq("Чата с id 999 нет - nil", findChat(id: 999, in: __t_list)?.title, nil, hint: "Если чата с таким id нет, верни nil")
__eq("Поиск в пустом списке - nil", findChat(id: 7, in: [])?.title, nil)

__eq("Лог: рабочий чат, сообщение доставлено", logLine(for: __t_work, status: .delivered), "Чат 105: Рабочий чат, непрочитанных: 12. Последнее сообщение: доставлено", hint: "Описание чата, точка, пробел, Последнее сообщение:, пробел и статус")
__eq("Лог: чат без непрочитанных, сообщение отправляется", logLine(for: __t_quiet, status: .sending), "Чат 64: Дача. Последнее сообщение: отправляется", hint: "Вставляй сами значения: \\(chat) и \\(status). Swift возьмёт текст из их description")
```

## @rules
- mustnot: /\.description\b/ :: Не вызывай `description` вручную: в интерполяции `\(chat)` Swift сам возьмёт текст из `description`.
- mustnot: /\btitle\s*==/ :: Ищи чат только по `id`: название может повторяться.

## @hint1
Начни с перечисления. Подпиши его на протокол через двоеточие и добавь внутрь вычисляемое свойство `description` типа `String`. В нём `switch self` и четыре ветки — по одной на каждый статус, в каждой свой текст.

Структуру `Chat` подпиши сразу на два протокола, через запятую. Для `Identifiable` ничего писать не нужно: свойство `id` уже есть. Для `CustomStringConvertible` нужен `description`. В нём выбор: если непрочитанных ноль — короткая строка из номера и названия, иначе — длинная, с числом в конце.

`findChat` ищет первый чат, у которого `id` совпадает с параметром. Метод для поиска первого подходящего элемента ты знаешь по «Ярмарке», и он сам вернёт опционал.

`logLine` — одна строка с интерполяцией. Вставь в неё сам чат и сам статус, как если бы это были строки: Swift возьмёт их описания.

## @hint2
Свой текст для `print` и интерполяции даёт свойство `description`:

```swift
struct Sticker: CustomStringConvertible {
    let pack: String
    let number: Int

    var description: String {
        return "Стикер \(number) из набора \(pack)"
    }
}

let sticker = Sticker(pack: "Коты", number: 4)
print("Отправлен: \(sticker)")    // Отправлен: Стикер 4 из набора Коты
```

Для перечисления внутри `description` используй `switch self` с веткой на каждый вариант.

## @hint3
Перечисление готово. Допиши структуру и функции:

```swift
struct Chat: Identifiable, ___ {
    let id: Int
    var title: String
    var unreadCount: Int

    var description: String {
        if unreadCount == 0 {
            return "Чат \(id): \(title)"
        }
        return ___
    }
}

func findChat(id: Int, in chats: [Chat]) -> Chat? {
    return chats.first { ___ }
}

func logLine(for chat: Chat, status: DeliveryStatus) -> String {
    return "\(chat). Последнее сообщение: \(status)"
}
```

В первом пропуске — протокол для описания текстом. Во втором — длинная строка с числом непрочитанных. В третьем — условие: `id` элемента равен параметру `id`.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** Подписав `DeliveryStatus` и `Chat` на `CustomStringConvertible`, ты пообещала Swift свойство `description`. Теперь везде, где значение превращается в текст, — в `print(chat)`, в `"\(status)"` — Swift берёт строку оттуда. Поэтому `logLine` такая короткая: `"\(chat). Последнее сообщение: \(status)"` сама подставляет оба описания. И поэтому вызывать `.description` вручную не нужно — так не пишут.

`description` — вычисляемое свойство. Переименовали чат или пришли новые сообщения — описание сразу отражает новые данные.

**Зачем `Identifiable`, если `id` и так был.** Свойство было, а обещания не было. Подпись говорит всем, кто работает с `Chat`, включая SwiftUI: «у каждого чата есть постоянный уникальный номер, опирайтесь на него». `findChat` опирается: два чата «Семья» для неё разные, а переименование чата поиск не ломает.

**Типичные ошибки:**

- поиск по `title` — первый же чат «Семья» найдётся вместо нужного, ровно как в жалобе пользователя;
- `description` объявлен как `let description = "..."` при создании — тогда он не меняется вместе с данными;
- в `logLine` написано `chat.description` — работает, но интерполяция делает это сама;
- забыта ветка для нуля непрочитанных — в списке появится странное `непрочитанных: 0`.
