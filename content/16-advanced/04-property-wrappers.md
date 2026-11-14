---
title: Аккуратные поля
concept: Обёртки свойств — @propertyWrapper
---

## @description

### Контекст
В «Чернилах» люди вставляют заголовки из мессенджеров и почты, а вместе с ними — лишние пробелы и переносы строк по краям. В списке заметок из-за этого всё «пляшет». А ещё в настройках редактора можно ввести любой размер шрифта: кто-то поставил 2 и больше не смог прочитать ни строчки.

Тимлид не хочет чинить это в каждом месте по отдельности: «Заголовки есть у заметок, папок и тегов. Числа с границами — у шрифта, отступов, громкости напоминаний. Сделай две обёртки, `@Trimmed` и `@Clamped`. Повесил на свойство — и оно само следит за собой».

### Новое в Swift
Ты уже умеешь следить за свойством через `didSet`. Но если одно и то же правило нужно десяти свойствам, придётся десять раз копировать один и тот же `didSet`. **Обёртка свойства** (property wrapper) выносит это правило в отдельный тип. Его пишут один раз, а потом вешают на любое свойство одной строкой.

Обёртка — это обычная структура с пометкой `@propertyWrapper`. Единственное требование — свойство с именем `wrappedValue`. Именно оно хранит и отдаёт значение:

```swift
@propertyWrapper
struct Lowercased {
    private var text = ""

    var wrappedValue: String {
        get { text }
        set { text = newValue.lowercased() }
    }

    init(wrappedValue: String) {
        self.wrappedValue = wrappedValue
    }
}
```

Пользоваться ей так:

```swift
struct Account {
    @Lowercased var email: String
}

var account = Account(email: "Bilol@Mail.RU")
print(account.email)               // bilol@mail.ru
account.email = "BILOL@INK.APP"
print(account.email)               // bilol@ink.app
```

Когда ты пишешь `account.email`, Swift на самом деле обращается к `wrappedValue` спрятанной внутри обёртки. Чтение идёт через `get`, присваивание — через `set`. Начальное значение приходит в `init(wrappedValue:)`. Обрати внимание: `init` вызывает `set`, поэтому правило работает и при создании, и при каждом изменении.

**Обёртка с настройкой.** У `init` могут быть и другие параметры. Их передают в скобках после имени обёртки:

```swift
@propertyWrapper
struct Step {
    private var value = 0
    private let step: Int

    var wrappedValue: Int {
        get { value }
        set { value = newValue / step * step }
    }

    init(wrappedValue: Int, _ step: Int) {
        self.step = step
        self.wrappedValue = wrappedValue
    }
}

struct Player {
    @Step(5) var volume: Int = 52     // Step(wrappedValue: 52, 5), станет 50
}
```

Значение после `=` попадает в параметр `wrappedValue`, а то, что в скобках, — в остальные параметры `init`.

> 💡 Ещё три инструмента для задачи. `max(a, b)` и `min(a, b)` возвращают большее и меньшее из двух чисел. У диапазона `10...32` есть свойства `lowerBound` (10) и `upperBound` (32). А метод `trimmingCharacters(in: .whitespacesAndNewlines)` из Foundation убирает пробелы, табуляции и переносы строк по краям текста, не трогая середину. Поэтому в заготовке уже есть `import Foundation`.

Обёртки ты встретишь повсюду: `@State` и `@Published` в приложениях для iPhone — тоже обёртки свойств.

### Задача
1. Напиши обёртку `@propertyWrapper struct Trimmed`:
   - `wrappedValue` типа `String`; при записи текст очищается от пробелов и переносов строк по краям;
   - `init(wrappedValue: String)` — начальное значение тоже очищается.
2. Напиши обёртку `@propertyWrapper struct Clamped`:
   - `wrappedValue` типа `Int`; при записи значение меньше нижней границы диапазона заменяется нижней границей, больше верхней — верхней. Значения внутри диапазона, включая сами границы, не меняются;
   - `init(wrappedValue: Int, _ range: ClosedRange<Int>)` — диапазон передаётся без метки, начальное значение тоже проверяется.
3. В структуре `NoteDraft` повесь `@Trimmed` на `title`, а `@Clamped(10...32)` — на `fontSize`. Значение `fontSize` по умолчанию оставь `16`.

### Пример
```swift
var draft = NoteDraft(title: "  Идеи для отпуска \n")
draft.title             // "Идеи для отпуска"
draft.fontSize          // 16
draft.fontSize = 48
draft.fontSize          // 32
NoteDraft(title: "План", fontSize: 4).fontSize    // 10
```

## @starter
```swift
import Foundation

// 1. Обёртка @Trimmed: убирает пробелы и переносы строк по краям


// 2. Обёртка @Clamped: держит число внутри диапазона


// 3. Черновик заметки: повесь обёртки на оба поля
struct NoteDraft {
    var title: String
    var fontSize: Int = 16
}

// Экран редактора. Этот код уже готов — менять его не нужно
var draft = NoteDraft(title: "   Список покупок \n")
draft.fontSize = 48
print("Заголовок: (\(draft.title))")
print("Размер шрифта: \(draft.fontSize)")
```

## @solution
```swift
import Foundation

// 1. Обёртка @Trimmed: убирает пробелы и переносы строк по краям
@propertyWrapper
struct Trimmed {
    private var text = ""

    var wrappedValue: String {
        get { text }
        set { text = newValue.trimmingCharacters(in: .whitespacesAndNewlines) }
    }

    init(wrappedValue: String) {
        self.wrappedValue = wrappedValue
    }
}

// 2. Обёртка @Clamped: держит число внутри диапазона
@propertyWrapper
struct Clamped {
    private var value = 0
    private let range: ClosedRange<Int>

    var wrappedValue: Int {
        get { value }
        set { value = min(max(newValue, range.lowerBound), range.upperBound) }
    }

    init(wrappedValue: Int, _ range: ClosedRange<Int>) {
        self.range = range
        self.wrappedValue = wrappedValue
    }
}

// 3. Черновик заметки: повесь обёртки на оба поля
struct NoteDraft {
    @Trimmed var title: String
    @Clamped(10...32) var fontSize: Int = 16
}

// Экран редактора. Этот код уже готов — менять его не нужно
var draft = NoteDraft(title: "   Список покупок \n")
draft.fontSize = 48
print("Заголовок: (\(draft.title))")
print("Размер шрифта: \(draft.fontSize)")
```

## @output
```
Заголовок: (Список покупок)
Размер шрифта: 32
```

## @tests
```swift
struct __t_Tag {
    @Trimmed var name: String
    @Clamped(1...5) var priority: Int = 3
}

var __t_tag = __t_Tag(name: "  работа  ")
__eq("@Trimmed очищает начальное значение", __t_tag.name, "работа", hint: "В init(wrappedValue:) присвой значение через self.wrappedValue — тогда сработает set с очисткой")
__t_tag.name = "\n\tидеи \n"
__eq("@Trimmed убирает переносы строк и табуляцию при записи", __t_tag.name, "идеи", hint: "Используй trimmingCharacters(in: .whitespacesAndNewlines) — он убирает не только пробелы")
__t_tag.name = "  два слова  "
__eq("Пробел в середине текста остаётся", __t_tag.name, "два слова", hint: "Убирать нужно только края. replacingOccurrences или filter удалили бы и пробел между словами")
__t_tag.name = "    "
__eq("Текст только из пробелов становится пустым", __t_tag.name, "")
__t_tag.name = "кофе"
__eq("Аккуратный текст не меняется", __t_tag.name, "кофе")

__eq("@Clamped: значение по умолчанию внутри диапазона", __t_tag.priority, 3)
__t_tag.priority = 9
__eq("@Clamped: больше верхней границы — становится 5", __t_tag.priority, 5, hint: "Если новое значение больше range.upperBound, сохрани upperBound")
__t_tag.priority = 0
__eq("@Clamped: меньше нижней границы — становится 1", __t_tag.priority, 1, hint: "Если новое значение меньше range.lowerBound, сохрани lowerBound")
__t_tag.priority = -40
__eq("@Clamped: отрицательное число — тоже 1", __t_tag.priority, 1)
__t_tag.priority = 5
__eq("@Clamped: ровно верхняя граница сохраняется", __t_tag.priority, 5)
__t_tag.priority = 1
__eq("@Clamped: ровно нижняя граница сохраняется", __t_tag.priority, 1)
__t_tag.priority = 4
__eq("@Clamped: значение внутри диапазона сохраняется", __t_tag.priority, 4, hint: "Числа внутри диапазона записывай как есть")
__eq("@Clamped проверяет и начальное значение", __t_Tag(name: "x", priority: 100).priority, 5, hint: "В init(wrappedValue:_:) значение тоже нужно ограничить: присвой его через self.wrappedValue")

__eq("Clamped можно создать напрямую: Clamped(wrappedValue: 50, 0...10)", Clamped(wrappedValue: 50, 0...10).wrappedValue, 10, hint: "Сигнатура: init(wrappedValue: Int, _ range: ClosedRange<Int>), диапазон без метки. Начальное значение тоже нужно ограничить")
__eq("Trimmed можно создать напрямую: Trimmed(wrappedValue:)", Trimmed(wrappedValue: " Чек-лист ").wrappedValue, "Чек-лист")

var __t_draft = NoteDraft(title: "  Идеи для отпуска \n")
__eq("NoteDraft: заголовок очищен", __t_draft.title, "Идеи для отпуска", hint: "Повесь @Trimmed на свойство title и проверь, что обёртка убирает и переносы строк")
__eq("NoteDraft: размер шрифта по умолчанию 16", __t_draft.fontSize, 16, hint: "Оставь значение по умолчанию: @Clamped(10...32) var fontSize: Int = 16")
__t_draft.fontSize = 33
__eq("NoteDraft: шрифт 33 ограничен до 32", __t_draft.fontSize, 32, hint: "Повесь @Clamped(10...32) на свойство fontSize")
__t_draft.fontSize = 10
__eq("NoteDraft: шрифт 10 разрешён", __t_draft.fontSize, 10)
__t_draft.fontSize = 9
__eq("NoteDraft: шрифт 9 поднят до 10", __t_draft.fontSize, 10)
__eq("NoteDraft: слишком мелкий шрифт при создании поднят до 10", NoteDraft(title: "План", fontSize: 4).fontSize, 10)
__t_draft.title = " Отпуск: билеты "
__eq("NoteDraft: заголовок очищается и при изменении", __t_draft.title, "Отпуск: билеты")
```

## @rules
- must: /@Trimmed\s+var\s+title\b/ :: Повесь обёртку на заголовок: `@Trimmed var title: String`.
- must: /@Clamped\s*\(\s*10\s*\.\.\.\s*32\s*\)\s*var\s+fontSize\b/ :: Повесь обёртку на размер шрифта: `@Clamped(10...32) var fontSize: Int = 16`.

## @hint1
Обе обёртки устроены одинаково. Это структура с пометкой `@propertyWrapper` над ней. Внутри — закрытое хранимое свойство, где лежит настоящее значение, и вычисляемое свойство `wrappedValue` с `get` и `set`. `get` просто отдаёт хранимое значение. `set` сначала приводит `newValue` в порядок и только потом сохраняет.

В `Trimmed` «привести в порядок» — значит обрезать края строки методом из Foundation.

В `Clamped` нужно ещё одно хранимое свойство — сам диапазон. В `set` ограничь число снизу (большее из числа и нижней границы), потом сверху (меньшее из результата и верхней границы).

В каждом `init` присвой начальное значение через `self.wrappedValue` — тогда сработает тот же `set`, и правило не придётся писать второй раз. В `Clamped` сначала сохрани диапазон: `set` пользуется им.

Последний шаг — дописать перед двумя свойствами `NoteDraft` имена обёрток со знаком `@`.

## @hint2
Каркас обёртки с настройкой:

```swift
@propertyWrapper
struct Clamped {
    private var value = 0
    private let range: ClosedRange<Int>

    var wrappedValue: Int {
        get { value }
        set { value = ... }
    }

    init(wrappedValue: Int, _ range: ClosedRange<Int>) {
        self.range = range
        self.wrappedValue = wrappedValue
    }
}
```

А так обёртки вешают на свойства:

```swift
@Trimmed var title: String
@Clamped(10...32) var fontSize: Int = 16
```

## @hint3
`Clamped` и `NoteDraft` готовы почти целиком, `Trimmed` устроена так же:

```swift
@propertyWrapper
struct Trimmed {
    private var text = ""

    var wrappedValue: String {
        get { text }
        set { text = newValue.___(in: .whitespacesAndNewlines) }
    }

    init(wrappedValue: String) {
        self.wrappedValue = wrappedValue
    }
}

@propertyWrapper
struct Clamped {
    private var value = 0
    private let range: ClosedRange<Int>

    var wrappedValue: Int {
        get { value }
        set { value = min(max(newValue, range.___), range.___) }
    }

    init(wrappedValue: Int, _ range: ClosedRange<Int>) {
        self.range = range
        self.wrappedValue = wrappedValue
    }
}

struct NoteDraft {
    @Trimmed var title: String
    @Clamped(10...32) var fontSize: Int = 16
}
```

В пропусках: метод Foundation для обрезки краёв строки и две границы диапазона — сначала нижняя, потом верхняя.

## @hint4
Вот готовое решение:

{{solution}}

**Как устроена обёртка.** Настоящее значение хранится в закрытом свойстве (`text` или `value`). Снаружи его не видно: доступ только через `wrappedValue`. Его `set` — единственное место, где значение может измениться, поэтому правило невозможно обойти. Когда редактор пишет `draft.title = "..."`, Swift вызывает `set` у обёртки `Trimmed`, спрятанной внутри `NoteDraft`.

**Почему `init` присваивает через `self.wrappedValue`.** Можно было бы написать в `init` отдельную очистку текста. Но тогда правило жило бы в двух местах, и однажды кто-то поправил бы только одно. Присваивание через `wrappedValue` проходит через тот же `set`. В `Clamped` порядок строк в `init` важен: `set` пользуется `range`, поэтому диапазон сохраняется первым.

**Как работает `min(max(...))`.** Сначала `max(newValue, 10)`: всё, что меньше 10, становится 10. Потом `min(результат, 32)`: всё, что больше 32, становится 32. Числа от 10 до 32 проходят без изменений.

**Что даёт `@Clamped(10...32)`.** Строка `@Clamped(10...32) var fontSize: Int = 16` превращается в вызов `Clamped(wrappedValue: 16, 10...32)`. Диапазон задаётся прямо там, где объявлено свойство, поэтому одна и та же обёртка подходит и шрифту, и громкости, и отступам.

**Типичные ошибки:**

- в `init` записать значение сразу в `text` или `value` — тогда начальное значение не очистится и не ограничится;
- в `Clamped` присвоить `self.wrappedValue` раньше, чем `self.range`, — Swift не даст пользоваться диапазоном, пока он не сохранён;
- обрезать только пробелы (`.whitespaces`) — переносы строк по краям останутся.
