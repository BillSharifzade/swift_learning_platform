---
title: Экспорт и импорт
concept: Codable, JSONEncoder и JSONDecoder, CodingKeys
---

## @description

### Контекст
Сервер синхронизации «Чернил» обменивается с приложением заметками в формате JSON. Ещё JSON нужен для кнопки «Сохранить резервную копию»: все заметки одним файлом.

Бэкенд-разработчик прислал пример ответа сервера. Почти все поля называются так же, как в нашей структуре, кроме одного: признак закрепления на сервере пишется `is_pinned`, а у нас — `isPinned`. Поле `folder` сервер присылает не всегда: у заметок без папки его просто нет.

Тимлид: «Сделай `Note` кодируемой, напиши экспорт и импорт. Ключи в JSON сортируй по алфавиту, чтобы копии одних и тех же заметок совпадали буква в букву. А если с сервера пришло что-то битое — приложение не должно падать: просто ноль заметок».

### Новое в Swift
**JSON** — текстовый формат для обмена данными. Фигурные скобки — объект с полями, квадратные — массив:

```text
{"city": "Казань", "temperature": 18, "is_rainy": false, "alerts": []}
```

**Codable.** Чтобы Swift умел превращать значение в JSON и обратно, тип подписывают на протокол `Codable`. Больше ничего писать не нужно: если все свойства — строки, числа, `Bool`, массивы, опционалы или другие `Codable`-типы, Swift сам сгенерирует весь код.

```swift
struct Forecast: Codable {
    let city: String
    let temperature: Int
    let isRainy: Bool
    let alerts: [String]
    let wind: Int?        // поля может не быть в JSON
}
```

**Кодирование.** `JSONEncoder` превращает значение в `Data` — набор байтов. Строку из байтов делает `String(decoding:as:)`:

```swift
let encoder = JSONEncoder()
encoder.outputFormatting = [.sortedKeys]       // ключи по алфавиту
let data = try encoder.encode(forecast)
let json = String(decoding: data, as: UTF8.self)
```

Без `.sortedKeys` порядок ключей не гарантирован и может меняться от запуска к запуску. Метод `encode` бросает ошибку, если значение закодировать нельзя, поэтому перед ним `try`.

**Декодирование.** `JSONDecoder` делает обратное. Ему говорят, *какой тип* ожидается: `Forecast.self` — для одного объекта, `[Forecast].self` — для массива. Байты из строки получаются через `Data(json.utf8)`:

```swift
let decoder = JSONDecoder()
let list = try decoder.decode([Forecast].self, from: Data(json.utf8))
```

`decode` бросает ошибку, если JSON сломан, обязательного поля нет или у поля не тот тип. Опционал (`wind`) может отсутствовать — тогда в нём будет `nil`.

**CodingKeys: другие имена ключей.** Если ключ в JSON называется не так, как свойство, внутри типа объявляют вложенное перечисление с именем `CodingKeys`. Его случаи — все свойства, которые участвуют в JSON, а у сырого значения — имя ключа:

```swift
struct Forecast: Codable {
    let city: String
    let isRainy: Bool

    enum CodingKeys: String, CodingKey {
        case city
        case isRainy = "is_rainy"
    }
}
```

> ⚠️ В `CodingKeys` перечисляют **все** свойства, а не только переименованные. Забытое свойство Swift не сможет ни записать, ни прочитать.

### Задача
В редакторе есть структура `Note`. Она уже `Equatable`.

1. Подпиши `Note` ещё и на `Codable`.
2. Объяви внутри `Note` перечисление `CodingKeys: String, CodingKey`. Свойство `isPinned` хранится в JSON под ключом `"is_pinned"`, остальные — под своими именами: `id`, `title`, `text`, `tags`, `folder`.
3. Напиши функцию `makeBackup(_:)`. Параметр `[Note]` без метки. Она бросает ошибки (`throws`) и возвращает `String` — JSON-массив заметок. Ключи отсортированы (`.sortedKeys`), других настроек форматирования нет.
4. Напиши функцию `parseNotes(_:)`. Параметр `String` без метки — JSON-массив. Она **не** бросает ошибки и возвращает `[Note]`. Если JSON не удалось разобрать — пустой массив.

### Пример
```swift
let note = Note(id: 1, title: "Идеи", text: "подкаст", tags: [], isPinned: false, folder: nil)
try makeBackup([note])
// [{"id":1,"is_pinned":false,"tags":[],"text":"подкаст","title":"Идеи"}]

parseNotes("[]")          // []
parseNotes("не JSON")     // []
```

## @starter
```swift
import Foundation

// Заметка
// 1. Подпиши структуру ещё и на Codable
struct Note: Equatable {
    let id: Int
    let title: String
    let text: String
    let tags: [String]
    let isPinned: Bool
    let folder: String?

    // 2. Ключи JSON: isPinned хранится как is_pinned

}

// 3. Экспорт: заметки в JSON с отсортированными ключами


// 4. Импорт: JSON в заметки. Не получилось — пустой массив


// Синхронизация. Этот код уже готов — менять его не нужно
let fromServer = """
[
  {"id": 7, "title": "Покупки", "text": "молоко, хлеб", "tags": ["дом"], "is_pinned": true},
  {"id": 8, "title": "Идеи", "text": "подкаст про книги", "tags": [], "is_pinned": false, "folder": "Личное"}
]
"""
let imported = parseNotes(fromServer)
print("Загружено заметок: \(imported.count)")
for note in imported {
    print("\(note.title): папка \(note.folder ?? "не выбрана")")
}

do {
    let backup = try makeBackup(imported)
    print(backup)
} catch {
    print("Не удалось сохранить копию")
}
```

## @solution
```swift
import Foundation

// Заметка
// 1. Подпиши структуру ещё и на Codable
struct Note: Equatable, Codable {
    let id: Int
    let title: String
    let text: String
    let tags: [String]
    let isPinned: Bool
    let folder: String?

    // 2. Ключи JSON: isPinned хранится как is_pinned
    enum CodingKeys: String, CodingKey {
        case id
        case title
        case text
        case tags
        case isPinned = "is_pinned"
        case folder
    }
}

// 3. Экспорт: заметки в JSON с отсортированными ключами
func makeBackup(_ notes: [Note]) throws -> String {
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.sortedKeys]
    let data = try encoder.encode(notes)
    return String(decoding: data, as: UTF8.self)
}

// 4. Импорт: JSON в заметки. Не получилось — пустой массив
func parseNotes(_ json: String) -> [Note] {
    let decoder = JSONDecoder()
    let notes = try? decoder.decode([Note].self, from: Data(json.utf8))
    return notes ?? []
}

// Синхронизация. Этот код уже готов — менять его не нужно
let fromServer = """
[
  {"id": 7, "title": "Покупки", "text": "молоко, хлеб", "tags": ["дом"], "is_pinned": true},
  {"id": 8, "title": "Идеи", "text": "подкаст про книги", "tags": [], "is_pinned": false, "folder": "Личное"}
]
"""
let imported = parseNotes(fromServer)
print("Загружено заметок: \(imported.count)")
for note in imported {
    print("\(note.title): папка \(note.folder ?? "не выбрана")")
}

do {
    let backup = try makeBackup(imported)
    print(backup)
} catch {
    print("Не удалось сохранить копию")
}
```

## @output
```
Загружено заметок: 2
Покупки: папка не выбрана
Идеи: папка Личное
[{"id":7,"is_pinned":true,"tags":["дом"],"text":"молоко, хлеб","title":"Покупки"},{"folder":"Личное","id":8,"is_pinned":false,"tags":[],"text":"подкаст про книги","title":"Идеи"}]
```

## @tests
```swift
let __t_notes = [
    Note(id: 101, title: "Отпуск", text: "билеты и отель", tags: ["путешествия", "срочно"], isPinned: true, folder: "Личное"),
    Note(id: 102, title: "Созвон", text: "в 11:00", tags: [], isPinned: false, folder: nil),
]

do {
    let __t_json = try makeBackup(__t_notes)
    __eq("Экспорт и обратный импорт дают те же заметки", parseNotes(__t_json), __t_notes, hint: "parseNotes(makeBackup(заметки)) должен вернуть исходные заметки")
    __ok("В JSON признак закрепления называется is_pinned", __t_json.contains("\"is_pinned\":true"), hint: "В CodingKeys напиши case isPinned = \"is_pinned\"")
    __ok("В JSON нет ключа isPinned", !__t_json.contains("isPinned"))
    __ok("Ключи отсортированы: каждая заметка начинается с folder или id", __t_json.hasPrefix("[{\"folder\":\"Личное\",\"id\":101,"), hint: "Включи сортировку ключей: encoder.outputFormatting = [.sortedKeys]")
    __ok("Заметка без папки записана без ключа folder", __t_json.contains("{\"id\":102,"), hint: "Для nil Swift сам пропускает ключ. Проверь, что у encoder нет лишних настроек вроде .prettyPrinted")
} catch {
    __fail("Экспорт двух заметок", "makeBackup бросил ошибку: \(error)")
}

do {
    let __t_one = Note(id: 5, title: "Чек-лист", text: "паспорт", tags: ["поездка"], isPinned: false, folder: "Дом")
    __eq("Экспорт одной заметки: точный JSON", try makeBackup([__t_one]), "[{\"folder\":\"Дом\",\"id\":5,\"is_pinned\":false,\"tags\":[\"поездка\"],\"text\":\"паспорт\",\"title\":\"Чек-лист\"}]", hint: "Ключи по алфавиту, без пробелов и переносов строк: только .sortedKeys")
    __eq("Экспорт пустого списка", try makeBackup([]), "[]")
} catch {
    __fail("Экспорт одной заметки", "makeBackup бросил ошибку: \(error)")
}

let __t_server = """
[{"id": 9, "title": "Рецепт", "text": "мука, яйца", "tags": ["дом", "еда"], "is_pinned": false, "folder": "Кухня"},
 {"id": 10, "title": "Пароль", "text": "в сейфе", "tags": [], "is_pinned": true}]
"""
let __t_imported = parseNotes(__t_server)
__eq("Импорт с сервера: две заметки", __t_imported.count, 2, hint: "Декодируй массив: decoder.decode([Note].self, from: Data(json.utf8)). Проверь ключ is_pinned в CodingKeys")
__eq("Импорт: первая заметка целиком", __t_imported.first, Note(id: 9, title: "Рецепт", text: "мука, яйца", tags: ["дом", "еда"], isPinned: false, folder: "Кухня"))
__eq("Импорт: is_pinned прочитан в isPinned", __t_imported.last?.isPinned, true)
__eq("Импорт: нет поля folder — папка nil", __t_imported.last?.folder, nil)

__eq("Пустой массив в JSON — ноль заметок", parseNotes("[]"), [])
__eq("Сломанный JSON — пустой массив, без падения", parseNotes("[{\"id\": 1, \"title\":"), [], hint: "Ошибку декодирования преврати в пустой массив: try? и ??")
__eq("Не JSON вовсе — пустой массив", parseNotes("сервер недоступен"), [])
__eq("Нет обязательного поля title — пустой массив", parseNotes("[{\"id\": 3, \"text\": \"x\", \"tags\": [], \"is_pinned\": true}]"), [])
__eq("Ключ isPinned вместо is_pinned не подходит", parseNotes("[{\"id\": 4, \"title\": \"a\", \"text\": \"b\", \"tags\": [], \"isPinned\": true}]"), [], hint: "Сервер присылает is_pinned. Если импорт принял isPinned, CodingKeys не объявлены или объявлены неверно")
```

## @rules
- must: /\benum\s+CodingKeys\s*:\s*String\s*,\s*CodingKey\b/ :: Объяви ключи внутри `Note`: `enum CodingKeys: String, CodingKey`.
- must: /\.sortedKeys\b/ :: Включи сортировку ключей: `encoder.outputFormatting = [.sortedKeys]`.
- mustnot: /\btry\s*!/ :: Не используй `try!`: битый JSON с сервера уронит приложение. Подойдёт `try?`.

## @hint1
Подписать на `Codable` — значит дописать его через запятую после `Equatable`. Все свойства заметки — строки, числа, `Bool`, массив и опционал, так что Swift сгенерирует остальное сам.

`CodingKeys` — это перечисление внутри `Note` с сырым значением `String`, подписанное на `CodingKey`. В нём шесть случаев — по одному на каждое свойство. Только у `isPinned` есть сырое значение с серверным именем ключа. У остальных оно совпадает с именем случая, и писать его не нужно.

`makeBackup` бросает ошибки, поэтому после списка параметров стоит `throws`. Внутри: создай кодировщик, включи сортировку ключей, закодируй массив (с `try`) и преврати байты в строку.

`parseNotes` ошибок не бросает. Создай декодировщик и попроси у него массив заметок из байтов строки. Перед `decoder.decode` поставь `try?` — при ошибке получится `nil`. Его замени на пустой массив.

## @hint2
Ключи с одним переименованным:

```swift
enum CodingKeys: String, CodingKey {
    case id
    case isPinned = "is_pinned"
    // и остальные свойства
}
```

Кодирование и декодирование массива:

```swift
let data = try encoder.encode(notes)
let text = String(decoding: data, as: UTF8.self)

let list = try? decoder.decode([Note].self, from: Data(json.utf8))
```

## @hint3
Осталось три пропуска:

```swift
struct Note: Equatable, Codable {
    // ...свойства...

    enum CodingKeys: String, CodingKey {
        case id
        case title
        case text
        case tags
        case isPinned = ___
        case folder
    }
}

func makeBackup(_ notes: [Note]) throws -> String {
    let encoder = JSONEncoder()
    encoder.outputFormatting = [___]
    let data = try encoder.encode(notes)
    return String(decoding: data, as: UTF8.self)
}

func parseNotes(_ json: String) -> [Note] {
    let decoder = JSONDecoder()
    let notes = try? decoder.decode(___, from: Data(json.utf8))
    return notes ?? []
}
```

В первом пропуске — имя ключа на сервере, в кавычках. Во втором — настройка сортировки ключей. В третьем — тип, который ожидается в JSON: массив заметок, с `.self` на конце.

## @hint4
Вот готовое решение:

{{solution}}

**Что даёт `Codable`.** Протокол состоит из двух половин: `Encodable` (умею превращаться в данные) и `Decodable` (умею собираться из данных). Свойства `Note` — простые типы, которые Swift уже умеет кодировать, поэтому весь код он пишет сам. Ты только говоришь, *как называются ключи*.

**Зачем `CodingKeys`.** Без него Swift взял бы ключи из имён свойств, и признак закрепления назывался бы `isPinned`. Сервер такой ключ не знает: при импорте поле `is_pinned` не нашлось бы, и decode выдал бы ошибку. Перечисление `CodingKeys` — это словарь «свойство → ключ в JSON». Оно вложено в `Note`, как `Style` в редактор в прошлой задаче.

**Почему `folder` просто пропадает.** `folder` — опционал. При кодировании Swift пропускает ключ, если значение `nil`. При декодировании отсутствующий ключ даёт `nil`. Поэтому заметка «Покупки» прочиталась без ошибки, хотя поля `folder` в ней нет.

**Почему экспорт бросает, а импорт — нет.** Экспорт может не получиться только из-за ошибки в программе, и тому, кто его вызвал, лучше об этом узнать: `throws` передаёт ошибку наверх, а код синхронизации ловит её в `do/catch`. Импорт работает с чужими данными, и тимлид решил так: битый ответ сервера — это ноль заметок, а не падение. `try?` превращает ошибку в `nil`, а `?? []` — в пустой массив.

**Почему `.sortedKeys`.** Без него порядок ключей в JSON не гарантирован. Две копии одних и тех же заметок могли бы отличаться порядком полей, и сравнение копий показывало бы разницу там, где её нет.

**Типичные ошибки:**

- в `CodingKeys` перечислить только `isPinned` — тогда остальные поля не будут ни записываться, ни читаться, и Swift не сможет собрать `Codable`;
- `decode(Note.self, ...)` вместо `[Note].self` — сервер прислал массив, а не один объект;
- `try!` вместо `try?` — первый же битый ответ сервера уронит приложение.
