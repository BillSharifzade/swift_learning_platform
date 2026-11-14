---
title: Планировщик дел
concept: Итог курса — Comparable, обёртки свойств, key paths
---

## @description

### Контекст
Планировщик дел «Успеть»: у каждого дела есть срок, приоритет и прогресс в процентах. Главный экран — «повестка»: что горит, что подождёт, что уже готово.

Дизайнер приложения прислала требования к повестке и к экрану сортировки:

- в повестке сначала незавершённые дела, потом готовые; среди незавершённых — по сроку, при одинаковом сроке важные выше;
- в настройках пользователь сам выбирает, по какому полю сортировать: по названию, сроку, приоритету или прогрессу;
- прогресс всегда от 0 до 100: ползунок на экране иногда присылает 105 или -3.

Тимлид предлагает: «Порядок по умолчанию — это `Comparable`. Сортировку по выбранному полю сделай одной функцией через key path, а не четырьмя копиями. А границы прогресса пусть держит обёртка свойства — тогда про них нельзя будет забыть».

### Что пригодится
- **`Comparable`.** Чтобы значения можно было сравнивать и сортировать через `sorted()`, тип реализует `static func <`. Операторы `>`, `<=`, `>=`, `max()` появятся сами.
- **Обёртка свойства** `@propertyWrapper` — тип со свойством `wrappedValue`. Обёрнутое свойство читают и пишут как обычное, а обёртка вмешивается в каждую запись. Параметры обёртки передаются в скобках: `@Clamped(0...100)`.
- **Диапазон** `0...100` имеет тип `ClosedRange<Int>`. Его границы — `lowerBound` (нижняя) и `upperBound` (верхняя). Функции `min(a, b)` и `max(a, b)` дают меньшее и большее из двух чисел.
- **Key path** — «адрес» свойства: `\Podcast.minutes`. Тип такого адреса — `KeyPath<Podcast, Int>`. Значение по адресу читают так: `podcast[keyPath: path]`.
- **Обобщённая функция с ограничением** `<T: Comparable>` принимает key path к свойству любого сравнимого типа.

Пример на других данных — подкасты:

```swift
@propertyWrapper
struct Lowercased {
    private var text = ""
    var wrappedValue: String {
        get { text }
        set { text = newValue.lowercased() }
    }
}

struct Podcast: Comparable {
    let title: String
    let minutes: Int
    @Lowercased var tag: String

    static func < (lhs: Podcast, rhs: Podcast) -> Bool {
        if lhs.minutes != rhs.minutes {
            return lhs.minutes < rhs.minutes
        }
        return lhs.title < rhs.title
    }
}

func longest<T: Comparable>(_ list: [Podcast], by path: KeyPath<Podcast, T>) -> Podcast? {
    list.max { $0[keyPath: path] < $1[keyPath: path] }
}

longest(shows, by: \.minutes)
longest(shows, by: \.title)
```

> 💡 Обёртке нужен `init(wrappedValue:)`, если обёрнутому свойству дают начальное значение. Если у обёртки есть параметры, они идут в `init` после `wrappedValue`: `init(wrappedValue: Int, _ range: ClosedRange<Int>)`.

### Задача
Перечисление `Priority` с `label`, структура `TodoItem` с `isDone` и `isOverdue`, `Planner.add(_:)` и заготовки уже готовы. Допиши всё, что помечено `TODO`.

1. Обёртка `Clamped` держит значение в диапазоне `range`. Число меньше нижней границы становится нижней границей, больше верхней — верхней. Это правило работает и в `init(wrappedValue:_:)`, и при каждой записи в `wrappedValue`.
2. `Priority` — `Comparable`: напиши `static func <` по `rawValue`. Тогда `.low < .normal < .high < .urgent`.
3. `var dueText: String` у `TodoItem`: `dueDay` меньше 0 — `просрочено`, 0 — `сегодня`, 1 — `завтра`, иначе `через 5 дн.` (с числом дней).
4. `TodoItem` — `Comparable`. Напиши `static func <` — порядок повестки:
   - незавершённые (`isDone` равно `false`) раньше завершённых;
   - затем меньший `dueDay` раньше;
   - затем более высокий `priority` раньше;
   - затем `title` по алфавиту.
5. `mutating func setProgress(_ value: Int, for title: String) -> Bool` у `Planner` — ставит прогресс делу с таким названием и возвращает `true`. Если дела нет — `false`. Обрезать значение вручную не нужно: это сделает обёртка.
6. `func sortedItems<T: Comparable>(by keyPath: KeyPath<TodoItem, T>, descending: Bool = false) -> [TodoItem]` — дела, упорядоченные по значению по адресу `keyPath`: по возрастанию или, если `descending` равно `true`, по убыванию. Дела с одинаковым значением идут в порядке повестки из пункта 4.
7. `func titles<T: Equatable>(where keyPath: KeyPath<TodoItem, T>, is value: T) -> [String]` — названия дел, у которых значение по адресу `keyPath` равно `value`, в порядке повестки.
8. `func agenda() -> [String]` — все дела в порядке повестки, по строке на дело: `Сдать отчёт (срочно): завтра, 40%`. Для завершённого дела вместо срока и процентов — `готово`: `Оплатить интернет (обычный): готово`.

### Пример
```swift
var planner = Planner()
planner.add(TodoItem(title: "Сдать отчёт", priority: .urgent, dueDay: 1, progress: 40))
planner.add(TodoItem(title: "Оплатить интернет", priority: .normal, dueDay: 0))
planner.setProgress(130, for: "Оплатить интернет")    // true, прогресс станет 100
planner.agenda()
// ["Сдать отчёт (срочно): завтра, 40%", "Оплатить интернет (обычный): готово"]
planner.sortedItems(by: \.title).map { $0.title }
// ["Оплатить интернет", "Сдать отчёт"]
planner.titles(where: \.priority, is: .urgent)       // ["Сдать отчёт"]
```

## @starter
```swift
// 1. Держит число в диапазоне range
@propertyWrapper
struct Clamped: Equatable {
    private var value: Int
    let range: ClosedRange<Int>

    init(wrappedValue: Int, _ range: ClosedRange<Int>) {
        self.range = range
        // TODO: сейчас значение сохраняется как есть, без диапазона
        value = wrappedValue
    }

    var wrappedValue: Int {
        get { value }
        // TODO: при записи значение тоже должно попадать в диапазон
        set { value = newValue }
    }
}

// Приоритет дела
enum Priority: Int, CaseIterable, Comparable {
    case low = 1, normal, high, urgent

    var label: String {
        switch self {
        case .low: return "низкий"
        case .normal: return "обычный"
        case .high: return "высокий"
        case .urgent: return "срочно"
        }
    }

    // 2. Сравнение приоритетов по rawValue
    static func < (lhs: Priority, rhs: Priority) -> Bool {
        // TODO
        return false
    }
}

// Дело. dueDay — через сколько дней срок: 0 — сегодня, -1 — вчера
struct TodoItem: Comparable {
    let title: String
    let priority: Priority
    let dueDay: Int
    @Clamped(0...100) var progress: Int = 0   // процент выполнения

    var isDone: Bool { progress == 100 }
    var isOverdue: Bool { dueDay < 0 && !isDone }

    // 3. "просрочено", "сегодня", "завтра" или "через 5 дн."
    var dueText: String {
        // TODO
        return ""
    }

    // 4. Порядок повестки
    static func < (lhs: TodoItem, rhs: TodoItem) -> Bool {
        // TODO
        return false
    }
}

struct Planner {
    private(set) var items: [TodoItem] = []

    mutating func add(_ item: TodoItem) {
        items.append(item)
    }

    // 5. Поставить прогресс делу. Нет такого дела — false
    mutating func setProgress(_ value: Int, for title: String) -> Bool {
        // TODO
        return false
    }

    // 6. Сортировка по любому полю. Равные значения — в порядке повестки
    func sortedItems<T: Comparable>(by keyPath: KeyPath<TodoItem, T>, descending: Bool = false) -> [TodoItem] {
        // TODO
        return items
    }

    // 7. Названия дел, у которых поле равно value, в порядке повестки
    func titles<T: Equatable>(where keyPath: KeyPath<TodoItem, T>, is value: T) -> [String] {
        // TODO
        return []
    }

    // 8. Повестка: "Сдать отчёт (срочно): завтра, 40%" или "... : готово"
    func agenda() -> [String] {
        // TODO
        return []
    }
}

// Неделя Билола
var planner = Planner()
planner.add(TodoItem(title: "Сдать отчёт", priority: .urgent, dueDay: 1, progress: 40))
planner.add(TodoItem(title: "Записаться к врачу", priority: .high, dueDay: 0))
planner.add(TodoItem(title: "Купить подарок маме", priority: .high, dueDay: 3, progress: 10))
planner.add(TodoItem(title: "Оплатить интернет", priority: .normal, dueDay: -1))
planner.add(TodoItem(title: "Разобрать почту", priority: .low, dueDay: 0, progress: 60))

if !planner.setProgress(105, for: "Разобрать почту") {
    print("Дело не найдено")
}

print("Повестка:")
for line in planner.agenda() {
    print(line)
}
print("По прогрессу: \(planner.sortedItems(by: \.progress, descending: true).map { $0.title })")
print("Важные: \(planner.titles(where: \.priority, is: .high))")
print("Просрочено: \(planner.titles(where: \.isOverdue, is: true))")
```

## @solution
```swift
// 1. Держит число в диапазоне range
@propertyWrapper
struct Clamped: Equatable {
    private var value: Int
    let range: ClosedRange<Int>

    init(wrappedValue: Int, _ range: ClosedRange<Int>) {
        self.range = range
        value = min(max(wrappedValue, range.lowerBound), range.upperBound)
    }

    var wrappedValue: Int {
        get { value }
        set { value = min(max(newValue, range.lowerBound), range.upperBound) }
    }
}

// Приоритет дела
enum Priority: Int, CaseIterable, Comparable {
    case low = 1, normal, high, urgent

    var label: String {
        switch self {
        case .low: return "низкий"
        case .normal: return "обычный"
        case .high: return "высокий"
        case .urgent: return "срочно"
        }
    }

    // 2. Сравнение приоритетов по rawValue
    static func < (lhs: Priority, rhs: Priority) -> Bool {
        lhs.rawValue < rhs.rawValue
    }
}

// Дело. dueDay — через сколько дней срок: 0 — сегодня, -1 — вчера
struct TodoItem: Comparable {
    let title: String
    let priority: Priority
    let dueDay: Int
    @Clamped(0...100) var progress: Int = 0   // процент выполнения

    var isDone: Bool { progress == 100 }
    var isOverdue: Bool { dueDay < 0 && !isDone }

    // 3. "просрочено", "сегодня", "завтра" или "через 5 дн."
    var dueText: String {
        if dueDay < 0 {
            return "просрочено"
        }
        switch dueDay {
        case 0: return "сегодня"
        case 1: return "завтра"
        default: return "через \(dueDay) дн."
        }
    }

    // 4. Порядок повестки
    static func < (lhs: TodoItem, rhs: TodoItem) -> Bool {
        if lhs.isDone != rhs.isDone {
            return !lhs.isDone
        }
        if lhs.dueDay != rhs.dueDay {
            return lhs.dueDay < rhs.dueDay
        }
        if lhs.priority != rhs.priority {
            return lhs.priority > rhs.priority
        }
        return lhs.title < rhs.title
    }
}

struct Planner {
    private(set) var items: [TodoItem] = []

    mutating func add(_ item: TodoItem) {
        items.append(item)
    }

    // 5. Поставить прогресс делу. Нет такого дела — false
    mutating func setProgress(_ value: Int, for title: String) -> Bool {
        guard let index = items.firstIndex(where: { $0.title == title }) else {
            return false
        }
        items[index].progress = value
        return true
    }

    // 6. Сортировка по любому полю. Равные значения — в порядке повестки
    func sortedItems<T: Comparable>(by keyPath: KeyPath<TodoItem, T>, descending: Bool = false) -> [TodoItem] {
        items.sorted { lhs, rhs in
            let left = lhs[keyPath: keyPath]
            let right = rhs[keyPath: keyPath]
            if left == right {
                return lhs < rhs
            }
            return descending ? left > right : left < right
        }
    }

    // 7. Названия дел, у которых поле равно value, в порядке повестки
    func titles<T: Equatable>(where keyPath: KeyPath<TodoItem, T>, is value: T) -> [String] {
        items.filter { $0[keyPath: keyPath] == value }.sorted().map { $0.title }
    }

    // 8. Повестка: "Сдать отчёт (срочно): завтра, 40%" или "... : готово"
    func agenda() -> [String] {
        items.sorted().map { item in
            let status = item.isDone ? "готово" : "\(item.dueText), \(item.progress)%"
            return "\(item.title) (\(item.priority.label)): \(status)"
        }
    }
}

// Неделя Билола
var planner = Planner()
planner.add(TodoItem(title: "Сдать отчёт", priority: .urgent, dueDay: 1, progress: 40))
planner.add(TodoItem(title: "Записаться к врачу", priority: .high, dueDay: 0))
planner.add(TodoItem(title: "Купить подарок маме", priority: .high, dueDay: 3, progress: 10))
planner.add(TodoItem(title: "Оплатить интернет", priority: .normal, dueDay: -1))
planner.add(TodoItem(title: "Разобрать почту", priority: .low, dueDay: 0, progress: 60))

if !planner.setProgress(105, for: "Разобрать почту") {
    print("Дело не найдено")
}

print("Повестка:")
for line in planner.agenda() {
    print(line)
}
print("По прогрессу: \(planner.sortedItems(by: \.progress, descending: true).map { $0.title })")
print("Важные: \(planner.titles(where: \.priority, is: .high))")
print("Просрочено: \(planner.titles(where: \.isOverdue, is: true))")
```

## @tests
```swift
struct __t_Rating {
    @Clamped(1...5) var stars: Int = 9
    @Clamped(-10...10) var shift: Int = -40
}
func __t_item(_ title: String, _ priority: Priority, _ due: Int, _ progress: Int = 0) -> TodoItem {
    TodoItem(title: title, priority: priority, dueDay: due, progress: progress)
}
func __t_titles(_ items: [TodoItem]) -> [String] {
    items.map { $0.title }
}

var __t_rating = __t_Rating()
__eq("Обёртка: начальное 9 в диапазоне 1...5 становится 5", __t_rating.stars, 5, hint: "В init(wrappedValue:_:) тоже нужно привести значение в диапазон")
__eq("Обёртка: начальное -40 в диапазоне -10...10 становится -10", __t_rating.shift, -10, hint: "Меньше нижней границы — значит, нижняя граница: range.lowerBound")
__t_rating.stars = 3
__eq("Обёртка: значение внутри диапазона не меняется", __t_rating.stars, 3)
__t_rating.stars = 0
__eq("Обёртка: запись 0 в диапазоне 1...5 даёт 1", __t_rating.stars, 1, hint: "При записи в wrappedValue значение тоже приводится в диапазон")
__t_rating.shift = 25
__eq("Обёртка: запись 25 в диапазоне -10...10 даёт 10", __t_rating.shift, 10)
__eq("Прогресс дела: 140 при создании становится 100", __t_item("Тест", .low, 0, 140).progress, 100)

__eq("Приоритеты по возрастанию", [Priority.urgent, .low, .high, .normal].sorted(), [.low, .normal, .high, .urgent], hint: "Сравнивай rawValue: lhs.rawValue < rhs.rawValue")
__ok("Высокий не меньше обычного", !(Priority.high < .normal))

__eq("Срок: вчера — просрочено", __t_item("Тест", .low, -1).dueText, "просрочено")
__eq("Срок: давно — тоже просрочено", __t_item("Тест", .low, -12).dueText, "просрочено", hint: "Любое отрицательное dueDay — просрочено")
__eq("Срок: сегодня", __t_item("Тест", .low, 0).dueText, "сегодня")
__eq("Срок: завтра", __t_item("Тест", .low, 1).dueText, "завтра")
__eq("Срок: через 2 дня", __t_item("Тест", .low, 2).dueText, "через 2 дн.")
__eq("Срок: через 14 дней", __t_item("Тест", .low, 14).dueText, "через 14 дн.", hint: "Число дней вставь интерполяцией")

let __t_mixed = [
    __t_item("Помыть окна", .low, 5),
    __t_item("Оплатить свет", .normal, 0, 100),
    __t_item("Позвонить в банк", .high, 2),
    __t_item("Забрать посылку", .high, 2),
    __t_item("Продлить полис", .urgent, 2),
    __t_item("Вернуть книгу", .normal, -3, 30)
]
__eq("Порядок повестки", __t_titles(__t_mixed.sorted()), ["Вернуть книгу", "Продлить полис", "Забрать посылку", "Позвонить в банк", "Помыть окна", "Оплатить свет"], hint: "Правила по очереди: незавершённые раньше, потом меньший dueDay, потом более высокий приоритет, потом название по алфавиту")
__ok("Готовое дело с ранним сроком идёт после незавершённого с поздним", __t_item("Б", .low, 9) < __t_item("А", .urgent, -5, 100), hint: "Первое правило — isDone: незавершённое всегда раньше")
__ok("При равном сроке срочное раньше высокого", __t_item("Я", .urgent, 1) < __t_item("А", .high, 1), hint: "Чем выше приоритет, тем раньше: lhs.priority > rhs.priority")

var __t_planner = Planner()
for item in __t_mixed {
    __t_planner.add(item)
}
__eq("setProgress: дело найдено — true", __t_planner.setProgress(150, for: "Помыть окна"), true)
__eq("setProgress: значение 150 обрезано до 100 обёрткой", __t_planner.items.first(where: { $0.title == "Помыть окна" })?.progress, 100, hint: "Меняй прогресс прямо в массиве по индексу: items[index].progress = value")
__eq("setProgress: нет дела — false", __t_planner.setProgress(50, for: "Полить цветы"), false)

__eq("Сортировка по названию", __t_titles(__t_planner.sortedItems(by: \.title)), ["Вернуть книгу", "Забрать посылку", "Оплатить свет", "Позвонить в банк", "Помыть окна", "Продлить полис"], hint: "Сравнивай значения по адресу: item[keyPath: keyPath]")
__eq("Сортировка по прогрессу по убыванию, равные — в порядке повестки", __t_titles(__t_planner.sortedItems(by: \.progress, descending: true)), ["Оплатить свет", "Помыть окна", "Вернуть книгу", "Продлить полис", "Забрать посылку", "Позвонить в банк"], hint: "Если значения по адресу равны, сравни сами дела: lhs < rhs. Иначе — по возрастанию или по убыванию в зависимости от descending")
__eq("Сортировка по сроку по возрастанию", __t_titles(__t_planner.sortedItems(by: \.dueDay)), ["Вернуть книгу", "Оплатить свет", "Продлить полис", "Забрать посылку", "Позвонить в банк", "Помыть окна"])
__eq("Сортировка по приоритету по убыванию", __t_titles(__t_planner.sortedItems(by: \.priority, descending: true)), ["Продлить полис", "Забрать посылку", "Позвонить в банк", "Вернуть книгу", "Оплатить свет", "Помыть окна"])

__eq("Фильтр: высокий приоритет, в порядке повестки", __t_planner.titles(where: \.priority, is: .high), ["Забрать посылку", "Позвонить в банк"], hint: "Оставь дела, у которых значение по адресу равно value, и отсортируй их порядком повестки: sorted()")
__eq("Фильтр: завершённые", __t_planner.titles(where: \.isDone, is: true), ["Оплатить свет", "Помыть окна"])
__eq("Фильтр: срок через 2 дня", __t_planner.titles(where: \.dueDay, is: 2), ["Продлить полис", "Забрать посылку", "Позвонить в банк"])
__eq("Фильтр: совпадений нет", __t_planner.titles(where: \.title, is: "Полить цветы"), [])

__eq("Повестка целиком", __t_planner.agenda(), ["Вернуть книгу (обычный): просрочено, 30%", "Продлить полис (срочно): через 2 дн., 0%", "Забрать посылку (высокий): через 2 дн., 0%", "Позвонить в банк (высокий): через 2 дн., 0%", "Оплатить свет (обычный): готово", "Помыть окна (низкий): готово"], hint: "Дела в порядке sorted(). Строка: название, приоритет в скобках, двоеточие, затем срок и процент или слово готово")
__eq("Пустая повестка", Planner().agenda(), [])
```

## @rules
- must: /\[\s*keyPath\s*:\s*keyPath\s*\]/ :: Читай значение по адресу: `item[keyPath: keyPath]`.
- mustnot: /\bmin\s*\(\s*max\s*\(\s*value\s*,\s*0\s*\)|\bmin\s*\(\s*value\s*,\s*100\s*\)/ :: В `setProgress` не обрезай значение вручную: это работа обёртки `@Clamped`.

## @hint1
Иди по номерам.

Обёртка: число приводится в диапазон так — сначала берёшь большее из числа и нижней границы, потом меньшее из результата и верхней границы. Сделай это в двух местах: в `init` и в `set`.

Приоритет: сравни сырые значения.

Срок: отдельно отрицательные дни, потом `switch` по трём вариантам.

Порядок повестки — цепочка «если отличается — решаем по этому правилу»: сначала `isDone`, потом `dueDay`, потом `priority` (выше — раньше), и только если всё совпало — по названию.

Планировщик. `setProgress` — найди индекс и запиши прогресс прямо в элемент массива. `sortedItems` — `sorted` с замыканием: достань значения по адресу у двух дел; если они равны, сравни сами дела, иначе сравни значения по возрастанию или по убыванию. `titles` — `filter`, затем `sorted()` и названия. `agenda` — `sorted()` и `map` с двумя видами строки.

## @hint2
Число в диапазоне:

```swift
value = min(max(newValue, range.lowerBound), range.upperBound)
```

Цепочка правил сравнения — каждое правило решает, только если по нему значения различаются:

```swift
if lhs.isDone != rhs.isDone {
    return !lhs.isDone
}
if lhs.dueDay != rhs.dueDay {
    return lhs.dueDay < rhs.dueDay
}
```

Сортировка по адресу:

```swift
items.sorted { lhs, rhs in
    let left = lhs[keyPath: keyPath]
    let right = rhs[keyPath: keyPath]
    // равны — порядок повестки, иначе по направлению
}
```

## @hint3
Заполни пропуски:

```swift
static func < (lhs: TodoItem, rhs: TodoItem) -> Bool {
    if lhs.isDone != rhs.isDone {
        return !lhs.isDone
    }
    if lhs.dueDay != rhs.dueDay {
        return lhs.dueDay < rhs.dueDay
    }
    if lhs.priority != rhs.priority {
        return ___
    }
    return lhs.title < rhs.title
}

func sortedItems<T: Comparable>(by keyPath: KeyPath<TodoItem, T>, descending: Bool = false) -> [TodoItem] {
    items.sorted { lhs, rhs in
        let left = lhs[keyPath: keyPath]
        let right = rhs[keyPath: keyPath]
        if left == right {
            return lhs < rhs
        }
        return descending ? ___ : left < right
    }
}

func titles<T: Equatable>(where keyPath: KeyPath<TodoItem, T>, is value: T) -> [String] {
    items.filter { ___ }.sorted().map { $0.title }
}

func agenda() -> [String] {
    items.sorted().map { item in
        let status = item.isDone ? "готово" : "\(item.dueText), \(item.progress)%"
        return "\(item.title) (\(item.priority.label)): \(status)"
    }
}
```

В первом пропуске — сравнение, при котором более высокий приоритет идёт раньше. Во втором — сравнение для порядка по убыванию. В третьем — условие: значение по адресу равно `value`.

## @hint4
Вот готовое решение:

{{solution}}

**Почему порядок повестки — `Comparable`.** Правило «незавершённые, потом по сроку, потом по важности» нужно в трёх местах: в повестке, в фильтре и при равных значениях в сортировке. Записанное один раз в `static func <`, оно работает везде, где написано `sorted()` или `lhs < rhs`. А у `Priority` после `<` сами появились `>` и сортировка — поэтому в сравнении дел можно написать `lhs.priority > rhs.priority`.

**Почему цепочка `if`, а не одно большое условие.** Каждое следующее правило должно включаться, только если предыдущее не решило спор. Цепочка «отличается — решаем, иначе идём дальше» читается как список требований дизайнера и не ломается, если добавить ещё одно правило.

**Зачем key path.** Без него пришлось бы писать отдельную функцию для каждого поля. `KeyPath<TodoItem, T>` — это адрес поля как значение: функция одна, а поле выбирает тот, кто её вызывает. Ограничение `T: Comparable` обещает, что значения по этому адресу можно сравнивать. В `titles` достаточно `T: Equatable` — там нужно только равенство.

**Зачем обёртка.** Прогресс меняют экран, синхронизация и импорт. Если обрезать значение в каждом из этих мест, рано или поздно кто-то забудет. `@Clamped` делает это при каждой записи, поэтому `setProgress` просто пишет число.

**Типичные ошибки:**

- обрезка только в `set`, а в `init` значение сохраняется как есть — `TodoItem(..., progress: 140)` остаётся со 140;
- `lhs.priority < rhs.priority` в сравнении дел — тогда низкий приоритет окажется выше срочного;
- в `sortedItems` при равных значениях возвращается `false` — порядок равных дел становится непредсказуемым;
- в `setProgress` дело копируется в переменную, и изменение не попадает в массив.
