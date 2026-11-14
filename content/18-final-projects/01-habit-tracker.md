---
title: Трекер привычек
concept: Итог курса — структуры, перечисления, коллекции, замыкания
---

## @description

### Контекст
Твой первый самостоятельный проект — трекер привычек «Росток». В нём отмечают, что сделано за неделю: зарядка, чтение, полить цветы. У каждой привычки есть цель («5 раз в неделю»), а за дни подряд приложение показывает серию.

Подруга-дизайнер уже нарисовала экраны. От тебя она ждёт «ядро» — модель данных и логику без интерфейса: «Экраны я подключу сама. Мне нужно, чтобы привычки добавлялись, отмечались по дням и считали прогресс. И сводку по категориям для главного экрана».

В редакторе заготовка: типы, их свойства и пустые места с пометкой `TODO`. Внизу — код, который показывает неделю Билола: так приложение будет пользоваться твоим ядром.

### Что пригодится
Нового здесь нет — только инструменты, которые ты уже знаешь.

- **Структура и `mutating`.** Метод, который меняет свойства структуры, помечают словом `mutating`.
- **Вычисляемое свойство** — значение, которое считается каждый раз при обращении: `var isEmpty: Bool { items.count == 0 }`.
- **Перечисление с сырыми значениями и `CaseIterable`.** `rawValue` даёт строку случая, `allCases` — все случаи в порядке объявления.
- **Set** хранит значения без повторов: `contains`, `insert`, `count`.
- **Замыкания для коллекций:** `filter`, `map`, `sorted()`, `contains(where:)`, `firstIndex(where:)`.

Пример на других данных — список покупок:

```swift
struct GroceryList {
    private(set) var items: [String] = []
    private(set) var bought: Set<String> = []

    mutating func add(_ item: String) -> Bool {
        if items.contains(where: { $0.lowercased() == item.lowercased() }) {
            return false
        }
        items.append(item)
        return true
    }

    var leftToBuy: [String] {
        items.filter { !bought.contains($0) }.sorted()
    }
}
```

> ⚠️ Элемент массива структур меняют **по индексу**: `habits[index].markDone(day: 2)`. Если сначала положить элемент в отдельную переменную, ты изменишь копию, а в массиве всё останется как было.

Дни недели в «Ростке» — числа от `1` (понедельник) до `7` (воскресенье). Серия считается внутри одной недели: воскресенье и следующий понедельник уже не соседи.

### Задача
Перечисления `HabitCategory` и `CheckInResult` уже готовы. Допиши всё, что помечено `TODO`.

**Структура `Habit`**

1. `mutating func markDone(day: Int) -> CheckInResult`:
   - если `day` не от 1 до 7 — вернуть `.invalidDay`;
   - если этот день уже есть в `doneDays` — вернуть `.alreadyMarked`;
   - иначе добавить день в `doneDays` и вернуть `.marked`.
2. `var doneCount: Int` — сколько дней отмечено.
3. `var isGoalReached: Bool` — `true`, если `doneCount` не меньше `weeklyGoal`.
4. `var bestStreak: Int` — самая длинная серия отмеченных дней подряд. Для дней 1, 2, 3, 5, 6 это `3`. Если отметок нет — `0`.
5. `var progressLine: String` — название, двоеточие и прогресс: `Чтение: 2 из 3`. Если цель выполнена, в конце через пробел добавляется `(готово)`: `Зарядка: 5 из 5 (готово)`.

**Структура `HabitTracker`**

6. `mutating func add(_ habit: Habit) -> Bool` — добавляет привычку в конец `habits` и возвращает `true`. Если привычка с таким же названием уже есть (**без учёта регистра**: «зарядка» и «Зарядка» — одно и то же), ничего не добавляет и возвращает `false`.
7. `mutating func markDone(_ title: String, day: Int) -> CheckInResult?` — находит привычку с точно таким названием и отмечает её методом из пункта 1. Возвращает его результат. Если привычки нет — `nil`.
8. `func habits(in category: HabitCategory) -> [Habit]` — привычки этой категории в порядке добавления.
9. `var completedTitles: [String]` — названия привычек с выполненной целью, по алфавиту.
10. `func categoryReport() -> [String]` — по строке на категорию в порядке `HabitCategory.allCases`: сырое значение категории, двоеточие и сколько привычек из этой категории выполнили цель: `Здоровье: 1 из 2`. Категории без привычек пропускаются.

### Пример
```swift
var reading = Habit(title: "Чтение", category: .mind, weeklyGoal: 3)
reading.markDone(day: 2)    // .marked
reading.markDone(day: 2)    // .alreadyMarked
reading.markDone(day: 8)    // .invalidDay
reading.markDone(day: 3)    // .marked
reading.bestStreak          // 2
reading.progressLine        // "Чтение: 2 из 3"

var tracker = HabitTracker()
tracker.add(reading)                                                   // true
tracker.add(Habit(title: "чтение", category: .mind, weeklyGoal: 7))    // false
tracker.markDone("Чтение", day: 5)                                     // .marked
tracker.markDone("Медитация", day: 1)                                  // nil
tracker.completedTitles                                                // ["Чтение"]
tracker.categoryReport()                                               // ["Развитие: 1 из 1"]
```

## @starter
```swift
// Категория привычки: от неё зависит цвет карточки
enum HabitCategory: String, CaseIterable {
    case health = "Здоровье"
    case mind = "Развитие"
    case home = "Дом"
}

// Чем закончилась попытка отметить привычку
enum CheckInResult {
    case marked          // отмечено
    case alreadyMarked   // в этот день уже отмечали
    case invalidDay      // такого дня недели нет
}

// Привычка. Дни недели — числа от 1 (понедельник) до 7 (воскресенье)
struct Habit {
    let title: String
    let category: HabitCategory
    let weeklyGoal: Int                       // сколько раз в неделю нужно выполнить
    private(set) var doneDays: Set<Int> = []  // в какие дни привычка выполнена

    // 1. Отметить выполнение в день day
    mutating func markDone(day: Int) -> CheckInResult {
        // TODO: проверь день и повтор, потом добавь день в doneDays
        return .invalidDay
    }

    // 2. Сколько дней отмечено
    var doneCount: Int {
        // TODO
        return 0
    }

    // 3. Выполнена ли цель на неделю
    var isGoalReached: Bool {
        // TODO
        return false
    }

    // 4. Самая длинная серия отмеченных дней подряд
    var bestStreak: Int {
        // TODO: пройди по дням от 1 до 7 и считай текущую серию
        return 0
    }

    // 5. Строка для карточки: "Чтение: 2 из 3" или "Зарядка: 5 из 5 (готово)"
    var progressLine: String {
        // TODO
        return ""
    }
}

// Все привычки пользователя
struct HabitTracker {
    private(set) var habits: [Habit] = []

    // 6. Добавить привычку. Такое название уже есть (без учёта регистра) — false
    mutating func add(_ habit: Habit) -> Bool {
        // TODO
        return false
    }

    // 7. Отметить привычку по названию. Нет такой привычки — nil
    mutating func markDone(_ title: String, day: Int) -> CheckInResult? {
        // TODO: найди индекс привычки и отметь её прямо в массиве
        return nil
    }

    // 8. Привычки одной категории в порядке добавления
    func habits(in category: HabitCategory) -> [Habit] {
        // TODO
        return []
    }

    // 9. Названия привычек с выполненной целью, по алфавиту
    var completedTitles: [String] {
        // TODO
        return []
    }

    // 10. Сводка по категориям: "Здоровье: 1 из 2"
    func categoryReport() -> [String] {
        // TODO
        return []
    }
}

// Неделя Билола — так приложение пользуется ядром
var tracker = HabitTracker()
let newHabits = [
    Habit(title: "Зарядка", category: .health, weeklyGoal: 5),
    Habit(title: "Чтение", category: .mind, weeklyGoal: 3),
    Habit(title: "Полить цветы", category: .home, weeklyGoal: 2),
    Habit(title: "зарядка", category: .health, weeklyGoal: 7)
]
for habit in newHabits {
    if !tracker.add(habit) {
        print("Уже есть: \(habit.title)")
    }
}

let checkIns = [("Зарядка", 1), ("Зарядка", 2), ("Зарядка", 3), ("Чтение", 3),
                ("Полить цветы", 2), ("Полить цветы", 6), ("Зарядка", 5), ("Йога", 4)]
for (title, day) in checkIns {
    if tracker.markDone(title, day: day) == nil {
        print("Нет привычки: \(title)")
    }
}

for habit in tracker.habits {
    print("\(habit.progressLine), лучшая серия: \(habit.bestStreak)")
}
print("Выполнено: \(tracker.completedTitles)")
for line in tracker.categoryReport() {
    print(line)
}
```

## @solution
```swift
// Категория привычки: от неё зависит цвет карточки
enum HabitCategory: String, CaseIterable {
    case health = "Здоровье"
    case mind = "Развитие"
    case home = "Дом"
}

// Чем закончилась попытка отметить привычку
enum CheckInResult {
    case marked          // отмечено
    case alreadyMarked   // в этот день уже отмечали
    case invalidDay      // такого дня недели нет
}

// Привычка. Дни недели — числа от 1 (понедельник) до 7 (воскресенье)
struct Habit {
    let title: String
    let category: HabitCategory
    let weeklyGoal: Int                       // сколько раз в неделю нужно выполнить
    private(set) var doneDays: Set<Int> = []  // в какие дни привычка выполнена

    // 1. Отметить выполнение в день day
    mutating func markDone(day: Int) -> CheckInResult {
        guard (1...7).contains(day) else {
            return .invalidDay
        }
        if doneDays.contains(day) {
            return .alreadyMarked
        }
        doneDays.insert(day)
        return .marked
    }

    // 2. Сколько дней отмечено
    var doneCount: Int {
        doneDays.count
    }

    // 3. Выполнена ли цель на неделю
    var isGoalReached: Bool {
        doneCount >= weeklyGoal
    }

    // 4. Самая длинная серия отмеченных дней подряд
    var bestStreak: Int {
        var best = 0
        var current = 0
        for day in 1...7 {
            if doneDays.contains(day) {
                current += 1
                best = max(best, current)
            } else {
                current = 0
            }
        }
        return best
    }

    // 5. Строка для карточки: "Чтение: 2 из 3" или "Зарядка: 5 из 5 (готово)"
    var progressLine: String {
        let line = "\(title): \(doneCount) из \(weeklyGoal)"
        return isGoalReached ? line + " (готово)" : line
    }
}

// Все привычки пользователя
struct HabitTracker {
    private(set) var habits: [Habit] = []

    // 6. Добавить привычку. Такое название уже есть (без учёта регистра) — false
    mutating func add(_ habit: Habit) -> Bool {
        let newTitle = habit.title.lowercased()
        if habits.contains(where: { $0.title.lowercased() == newTitle }) {
            return false
        }
        habits.append(habit)
        return true
    }

    // 7. Отметить привычку по названию. Нет такой привычки — nil
    mutating func markDone(_ title: String, day: Int) -> CheckInResult? {
        guard let index = habits.firstIndex(where: { $0.title == title }) else {
            return nil
        }
        return habits[index].markDone(day: day)
    }

    // 8. Привычки одной категории в порядке добавления
    func habits(in category: HabitCategory) -> [Habit] {
        habits.filter { $0.category == category }
    }

    // 9. Названия привычек с выполненной целью, по алфавиту
    var completedTitles: [String] {
        habits.filter { $0.isGoalReached }.map { $0.title }.sorted()
    }

    // 10. Сводка по категориям: "Здоровье: 1 из 2"
    func categoryReport() -> [String] {
        var lines: [String] = []
        for category in HabitCategory.allCases {
            let list = habits(in: category)
            if list.isEmpty {
                continue
            }
            let reached = list.filter { $0.isGoalReached }.count
            lines.append("\(category.rawValue): \(reached) из \(list.count)")
        }
        return lines
    }
}

// Неделя Билола — так приложение пользуется ядром
var tracker = HabitTracker()
let newHabits = [
    Habit(title: "Зарядка", category: .health, weeklyGoal: 5),
    Habit(title: "Чтение", category: .mind, weeklyGoal: 3),
    Habit(title: "Полить цветы", category: .home, weeklyGoal: 2),
    Habit(title: "зарядка", category: .health, weeklyGoal: 7)
]
for habit in newHabits {
    if !tracker.add(habit) {
        print("Уже есть: \(habit.title)")
    }
}

let checkIns = [("Зарядка", 1), ("Зарядка", 2), ("Зарядка", 3), ("Чтение", 3),
                ("Полить цветы", 2), ("Полить цветы", 6), ("Зарядка", 5), ("Йога", 4)]
for (title, day) in checkIns {
    if tracker.markDone(title, day: day) == nil {
        print("Нет привычки: \(title)")
    }
}

for habit in tracker.habits {
    print("\(habit.progressLine), лучшая серия: \(habit.bestStreak)")
}
print("Выполнено: \(tracker.completedTitles)")
for line in tracker.categoryReport() {
    print(line)
}
```

## @tests
```swift
func __t_habit(_ title: String, _ category: HabitCategory, goal: Int, days: [Int]) -> Habit {
    var habit = Habit(title: title, category: category, weeklyGoal: goal)
    for day in days {
        _ = habit.markDone(day: day)
    }
    return habit
}

var __t_run = Habit(title: "Пробежка", category: .health, weeklyGoal: 3)
__eq("Отметка во вторник: .marked", __t_run.markDone(day: 2), .marked, hint: "Для дня от 1 до 7, которого ещё нет в doneDays, добавь день и верни .marked")
__eq("Повторная отметка во вторник: .alreadyMarked", __t_run.markDone(day: 2), .alreadyMarked, hint: "Если день уже есть в doneDays, верни .alreadyMarked")
__eq("День 0 не существует: .invalidDay", __t_run.markDone(day: 0), .invalidDay, hint: "Дни недели — числа от 1 до 7. Всё остальное — .invalidDay")
__eq("День 8 не существует: .invalidDay", __t_run.markDone(day: 8), .invalidDay, hint: "Дни недели — числа от 1 до 7. Всё остальное — .invalidDay")
__eq("Воскресенье (день 7) — обычный день: .marked", __t_run.markDone(day: 7), .marked, hint: "Граница 7 входит в неделю: проверь условие на день")
__eq("Понедельник (день 1) — обычный день: .marked", __t_run.markDone(day: 1), .marked, hint: "Граница 1 входит в неделю: проверь условие на день")
__eq("После отметок 2, 7, 1 и двух неверных дней: doneCount = 3", __t_run.doneCount, 3, hint: "Неверные дни и повторы не должны попадать в doneDays")
__eq("Цель 3 из 3 выполнена ровно на границе", __t_run.isGoalReached, true, hint: "Цель выполнена, если doneCount больше или равно weeklyGoal")
__eq("Строка выполненной привычки", __t_run.progressLine, "Пробежка: 3 из 3 (готово)", hint: "Если цель выполнена, после прогресса через пробел добавь (готово)")

let __t_book = __t_habit("Английский", .mind, goal: 4, days: [5, 6, 7])
__eq("3 из 4 — цель не выполнена", __t_book.isGoalReached, false)
__eq("Строка невыполненной привычки", __t_book.progressLine, "Английский: 3 из 4", hint: "Формат: название, двоеточие, пробел, сколько отмечено, слово из и цель")

__eq("Серия: дни 1, 2, 3, 5, 6 — лучшая серия 3", __t_habit("Растяжка", .health, goal: 5, days: [6, 2, 5, 1, 3]).bestStreak, 3, hint: "Иди по дням от 1 до 7 по порядку: отмеченный день увеличивает текущую серию, пропуск обнуляет её")
__eq("Серия: дни 4, 5, 6, 7 — серия до конца недели", __t_habit("Растяжка", .health, goal: 5, days: [7, 4, 6, 5]).bestStreak, 4, hint: "Серия, которая длится до воскресенья, тоже должна попасть в ответ: запоминай лучшую серию сразу, а не только при пропуске")
__eq("Серия: дни 1, 3, 5, 7 — серия 1", __t_habit("Растяжка", .health, goal: 5, days: [1, 3, 5, 7]).bestStreak, 1)
__eq("Серия: нет отметок — 0", Habit(title: "Растяжка", category: .health, weeklyGoal: 5).bestStreak, 0)

var __t_tracker = HabitTracker()
__eq("Добавление новой привычки: true", __t_tracker.add(Habit(title: "Медитация", category: .mind, weeklyGoal: 2)), true, hint: "Если такого названия ещё нет, добавь привычку в habits и верни true")
_ = __t_tracker.add(Habit(title: "Уборка", category: .home, weeklyGoal: 1))
_ = __t_tracker.add(Habit(title: "Курс Swift", category: .mind, weeklyGoal: 1))
__eq("Повтор в другом регистре (МЕДИТАЦИЯ): false", __t_tracker.add(Habit(title: "МЕДИТАЦИЯ", category: .health, weeklyGoal: 7)), false, hint: "Названия сравниваются без учёта регистра: переведи оба в lowercased()")
__eq("Повтор не попал в список: привычек 3", __t_tracker.habits.count, 3)

__eq("Отметка несуществующей привычки: nil", __t_tracker.markDone("Бег", day: 1), nil, hint: "Если привычки с таким названием нет, верни nil")
__eq("Отметка Медитации в среду: .marked", __t_tracker.markDone("Медитация", day: 3), .marked)
__eq("Повторная отметка Медитации в среду: .alreadyMarked", __t_tracker.markDone("Медитация", day: 3), .alreadyMarked, hint: "Похоже, отметка меняет копию привычки, а не элемент массива. Меняй прямо в массиве: habits[index].markDone(day:)")
_ = __t_tracker.markDone("Медитация", day: 4)
_ = __t_tracker.markDone("Уборка", day: 6)
__eq("Отметки сохраняются в самом трекере", __t_tracker.habits.map { $0.doneCount }, [2, 1, 0], hint: "Меняй элемент массива по индексу: habits[index].markDone(day:)")

__eq("Привычки категории Развитие в порядке добавления", __t_tracker.habits(in: .mind).map { $0.title }, ["Медитация", "Курс Swift"])
__eq("В категории Здоровье пусто", __t_tracker.habits(in: .health).count, 0)
__eq("Выполненные цели по алфавиту", __t_tracker.completedTitles, ["Медитация", "Уборка"], hint: "Отбери привычки с выполненной целью, возьми названия и отсортируй их")
__eq("Сводка: категории по порядку, пустые пропущены", __t_tracker.categoryReport(), ["Развитие: 1 из 2", "Дом: 1 из 1"], hint: "Иди по HabitCategory.allCases, пропускай категории без привычек, считай, сколько привычек выполнили цель")

let __t_empty = HabitTracker()
__eq("Пустой трекер: выполненных нет", __t_empty.completedTitles, [])
__eq("Пустой трекер: сводка пустая", __t_empty.categoryReport(), [], hint: "Если привычек нет ни в одной категории, сводка — пустой массив")
```

## @hint1
Иди по пунктам сверху вниз и после каждого нажимай «Проверить» — проверки подскажут, что ещё не готово.

`markDone(day:)` — три исхода по порядку. Сначала проверь, что день лежит в диапазоне от 1 до 7, иначе сразу верни «неверный день». Потом спроси у множества `doneDays`, есть ли там этот день. И только если обе проверки пройдены, добавь день и верни «отмечено».

`doneCount` и `isGoalReached` — по одной строке: размер множества и сравнение с целью.

`bestStreak` — цикл по дням от 1 до 7 и две переменные: текущая серия и лучшая. Отмеченный день увеличивает текущую серию и, если она стала больше лучшей, обновляет лучшую. Пропуск обнуляет текущую.

`progressLine` — собери основную строку интерполяцией, а потом добавь хвост, если цель выполнена.

В трекере: для `add` проверь через `contains(where:)`, нет ли названия в нижнем регистре. Для `markDone` найди индекс через `firstIndex(where:)` и вызови метод привычки прямо у элемента массива. Остальное — `filter`, `map`, `sorted()` и цикл по `allCases`.

## @hint2
Два самых непростых места — серия дней и изменение элемента массива.

Серия — это «текущая» и «лучшая»:

```swift
var best = 0
var current = 0
for day in 1...7 {
    if doneDays.contains(day) {
        current += 1
        best = max(best, current)
    } else {
        current = 0
    }
}
```

Изменение привычки внутри трекера — по индексу, иначе изменится копия:

```swift
guard let index = habits.firstIndex(where: { $0.title == title }) else {
    return nil
}
return habits[index].markDone(day: day)
```

## @hint3
Почти всё готово. Заполни пропуски:

```swift
mutating func markDone(day: Int) -> CheckInResult {
    guard (1...7).contains(day) else {
        return .invalidDay
    }
    if doneDays.contains(day) {
        return ___
    }
    doneDays.insert(day)
    return .marked
}

var progressLine: String {
    let line = "\(title): \(doneCount) из \(weeklyGoal)"
    return isGoalReached ? line + " (готово)" : line
}

mutating func add(_ habit: Habit) -> Bool {
    let newTitle = habit.title.lowercased()
    if habits.contains(where: { ___ }) {
        return false
    }
    habits.append(habit)
    return true
}

var completedTitles: [String] {
    habits.filter { $0.isGoalReached }.map { $0.title }.sorted()
}

func categoryReport() -> [String] {
    var lines: [String] = []
    for category in HabitCategory.allCases {
        let list = habits(in: category)
        if list.isEmpty {
            continue
        }
        let reached = ___
        lines.append("\(category.rawValue): \(reached) из \(list.count)")
    }
    return lines
}
```

В первом пропуске — результат для дня, который уже отмечен. Во втором — сравнение названия очередной привычки в нижнем регистре с `newTitle`. В третьем — сколько привычек из `list` выполнили цель: отфильтруй и возьми `count`.

## @hint4
Вот готовое решение:

{{solution}}

**Как устроено ядро.** `Habit` отвечает за одну привычку и ничего не знает о других. `HabitTracker` хранит список и решает задачи «про всех»: повторы, поиск по названию, сводки. Так и в настоящих приложениях: маленькие типы с понятной ответственностью легче проверять и менять.

**Почему дни — это `Set<Int>`.** Отметить один день дважды нельзя по смыслу, а множество само не хранит повторов. Порядок дней во множестве случаен, поэтому `bestStreak` не перебирает `doneDays`, а идёт по дням недели от 1 до 7 и спрашивает `contains`. Так порядок всегда правильный.

**Почему `best` обновляется на каждом шаге.** Если обновлять лучшую серию только при пропуске, серия, которая тянется до воскресенья, потеряется: после неё пропуска уже нет.

**Почему `habits[index].markDone(day:)`.** Структура — значение. Строка `var habit = habits[index]` создаёт копию, и отметка попадёт в копию, а трекер её не увидит. Вызов метода прямо у элемента массива меняет сам элемент.

**Почему `guard` в `markDone(day:)`.** Неверный день — это «дальше идти нечего». `guard` сразу отсекает этот случай, и остальной код читается без лишней вложенности.

**Типичные ошибки:**

- в `add` сравнивают названия без `lowercased()` — тогда «зарядка» и «Зарядка» станут двумя привычками;
- диапазон `1..<7` вместо `1...7` — воскресенье окажется «неверным днём»;
- в `categoryReport` забыт `continue` для пустых категорий, и появляется строка `Дом: 0 из 0`;
- в `completedTitles` забыта сортировка — порядок совпадёт с порядком добавления, а нужен алфавитный.
