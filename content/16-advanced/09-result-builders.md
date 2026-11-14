---
title: Конструктор чек-листа
concept: Построители результата — @resultBuilder
---

## @description

### Контекст
В «Чернилах» есть шаблоны чек-листов: «Сборы в поездку», «Переезд», «Праздник». Пункты в них зависят от условий: за границу нужен загранпаспорт, в короткую поездку — только ручная кладь.

Сейчас шаблоны написаны через `var items = []`, десятки `append` и `if` вокруг них, и читать их тяжело. Коллега из команды уже переписал шаблон поездки так, как хочет видеть все шаблоны: просто строки пунктов одна под другой, и `if` прямо между ними. Но код не собирается: не хватает «конструктора», который превратит эти строки в чек-лист. Его и нужно написать.

### Новое в Swift
**Построитель результата** (result builder) позволяет писать внутри замыкания просто значения, по одному в строке, без `return` и `append`. Swift сам соберёт их в один результат по правилам, которые ты задашь. Так устроен SwiftUI: строки `Text(...)` и `Button(...)` внутри `VStack { }` собирает именно построитель.

Построитель — это тип с пометкой `@resultBuilder` и статическими методами с особыми именами. Главный — `buildBlock`. Он получает все значения из строк блока и возвращает итог:

```swift
@resultBuilder
struct MessageBuilder {
    static func buildBlock(_ parts: String...) -> String {
        return parts.reduce("") { $0 + $1 }
    }
}
```

Пометку построителя ставят на функцию или на параметр-замыкание:

```swift
@MessageBuilder
func deliveryText(minutes: Int) -> String {
    "Курьер выехал. "
    "Будет через \(minutes) мин."
}
```

Swift превращает тело функции в вызов `MessageBuilder.buildBlock("Курьер выехал. ", "Будет через 15 мин.")`. Параметр `parts` — variadic, поэтому строк в блоке может быть сколько угодно, даже ноль.

**Условия.** Чтобы внутри блока можно было писать `if`, построителю нужны ещё методы:

- `buildOptional` — для `if` без `else`. Содержимое `if` сначала собирается своим `buildBlock`. Если условие ложно, вместо результата приходит `nil`:

  ```swift
  static func buildOptional(_ part: String?) -> String {
      return part ?? ""
  }
  ```

- `buildEither(first:)` и `buildEither(second:)` — для `if` с `else`. Первый получает собранную ветку `if`, второй — ветку `else`.

**Превращение строк блока.** Метод `buildExpression` вызывается для *каждой* строки блока до `buildBlock`. Он позволяет писать в блоке значения одного типа, а собирать — другого:

```swift
static func buildExpression(_ minutes: Int) -> String {
    return "\(minutes) мин. "
}
```

Теперь в блоке можно написать просто `15`, и оно превратится в `"15 мин. "`. Учти: если у построителя есть хотя бы один `buildExpression`, через него проходят *все* строки блока. Поэтому для строк `String` понадобится свой вариант — `buildExpression(_ text: String) -> String`, который возвращает текст как есть.

Важно, чтобы типы сходились. То, что возвращают `buildExpression`, `buildOptional` и `buildEither`, приходит на вход `buildBlock`. А то, что возвращает `buildBlock`, приходит в `buildOptional` и `buildEither`. Удобнее всего, когда везде один и тот же тип.

> 💡 Для циклов `for` внутри блока нужен ещё `buildArray`. В этой задаче он не понадобится.

### Задача
В редакторе есть структуры `ChecklistItem` (пункт: `title` и `isDone`) и `Checklist` (название и массив пунктов), а также готовый шаблон `tripChecklist`.

1. Напиши построитель `@resultBuilder struct ChecklistBuilder`. Все его методы работают с типом `[ChecklistItem]`:
   - `buildExpression(_ title: String) -> [ChecklistItem]` — из строки делает массив из одного пункта с этим названием (не выполненного);
   - `buildBlock(_ parts: [ChecklistItem]...) -> [ChecklistItem]` — склеивает все части в один массив, сохраняя порядок;
   - `buildOptional(_ part: [ChecklistItem]?) -> [ChecklistItem]` — пункты из `if`, а если условие ложно — пустой массив;
   - `buildEither(first part: [ChecklistItem]) -> [ChecklistItem]` и `buildEither(second part: [ChecklistItem]) -> [ChecklistItem]` — возвращают переданные пункты.
2. Напиши функцию `makeChecklist(_:items:)`. Первый параметр — название типа `String` без метки. Второй — `items` типа `() -> [ChecklistItem]` с пометкой `@ChecklistBuilder`. Возвращает `Checklist` с этим названием и пунктами из замыкания.

Шаблон `tripChecklist` и код внизу не меняй.

### Пример
```swift
let moving = makeChecklist("Переезд") {
    "Коробки"
    "Скотч"
    if hasPiano {
        "Грузчики"
    }
}
moving.items.map { $0.title }   // ["Коробки", "Скотч", "Грузчики"], если hasPiano
```

## @starter
```swift
// Пункт чек-листа
struct ChecklistItem: Equatable {
    let title: String
    var isDone = false
}

// Чек-лист
struct Checklist {
    let title: String
    let items: [ChecklistItem]
}

// 1. Построитель чек-листа


// 2. Функция, которая принимает блок пунктов


// Шаблон, который уже написал коллега. Менять его не нужно
func tripChecklist(abroad: Bool, days: Int) -> Checklist {
    makeChecklist("Сборы в поездку") {
        "Билеты"
        "Зарядка для телефона"
        if abroad {
            "Загранпаспорт"
            "Страховка"
        }
        if days > 3 {
            "Чемодан"
        } else {
            "Рюкзак"
        }
    }
}

// Экран шаблонов. Этот код уже готов — менять его не нужно
let trip = tripChecklist(abroad: true, days: 5)
print("\(trip.title):")
for item in trip.items {
    print("- \(item.title)")
}
print("Пунктов для дачи на выходные: \(tripChecklist(abroad: false, days: 2).items.count)")
```

## @solution
```swift
// Пункт чек-листа
struct ChecklistItem: Equatable {
    let title: String
    var isDone = false
}

// Чек-лист
struct Checklist {
    let title: String
    let items: [ChecklistItem]
}

// 1. Построитель чек-листа
@resultBuilder
struct ChecklistBuilder {
    static func buildExpression(_ title: String) -> [ChecklistItem] {
        return [ChecklistItem(title: title)]
    }

    static func buildBlock(_ parts: [ChecklistItem]...) -> [ChecklistItem] {
        return parts.flatMap { $0 }
    }

    static func buildOptional(_ part: [ChecklistItem]?) -> [ChecklistItem] {
        return part ?? []
    }

    static func buildEither(first part: [ChecklistItem]) -> [ChecklistItem] {
        return part
    }

    static func buildEither(second part: [ChecklistItem]) -> [ChecklistItem] {
        return part
    }
}

// 2. Функция, которая принимает блок пунктов
func makeChecklist(_ title: String, @ChecklistBuilder items: () -> [ChecklistItem]) -> Checklist {
    return Checklist(title: title, items: items())
}

// Шаблон, который уже написал коллега. Менять его не нужно
func tripChecklist(abroad: Bool, days: Int) -> Checklist {
    makeChecklist("Сборы в поездку") {
        "Билеты"
        "Зарядка для телефона"
        if abroad {
            "Загранпаспорт"
            "Страховка"
        }
        if days > 3 {
            "Чемодан"
        } else {
            "Рюкзак"
        }
    }
}

// Экран шаблонов. Этот код уже готов — менять его не нужно
let trip = tripChecklist(abroad: true, days: 5)
print("\(trip.title):")
for item in trip.items {
    print("- \(item.title)")
}
print("Пунктов для дачи на выходные: \(tripChecklist(abroad: false, days: 2).items.count)")
```

## @output
```
Сборы в поездку:
- Билеты
- Зарядка для телефона
- Загранпаспорт
- Страховка
- Чемодан
Пунктов для дачи на выходные: 3
```

## @tests
```swift
let __t_moving = makeChecklist("Переезд") {
    "Коробки"
    "Скотч"
    "Маркер"
}
__eq("Название чек-листа", __t_moving.title, "Переезд", hint: "makeChecklist должна сохранить переданное название")
__eq("Три строки — три пункта по порядку", __t_moving.items.map { $0.title }, ["Коробки", "Скотч", "Маркер"], hint: "buildBlock должен склеить все части в один массив: parts.flatMap { $0 }")
__ok("Новые пункты не выполнены", __t_moving.items.allSatisfy { !$0.isDone }, hint: "buildExpression создаёт ChecklistItem(title: title) — isDone по умолчанию false")

let __t_single = makeChecklist("Одно дело") {
    "Позвонить в банк"
}
__eq("Один пункт", __t_single.items, [ChecklistItem(title: "Позвонить в банк")])

let __t_empty = makeChecklist("Пусто") { }
__eq("Пустой блок — пустой чек-лист", __t_empty.items.count, 0)

func __t_party(guests: Int, outdoor: Bool) -> Checklist {
    makeChecklist("Праздник") {
        "Торт"
        if guests > 10 {
            "Заказать зал"
        }
        if outdoor {
            "Пледы"
            "Зонты"
        } else {
            "Музыка"
        }
        "Свечи"
    }
}
__eq("if выполнился: пункт добавлен на своё место", __t_party(guests: 12, outdoor: false).items.map { $0.title }, ["Торт", "Заказать зал", "Музыка", "Свечи"], hint: "buildOptional должен вернуть пункты из if, если они есть")
__eq("if не выполнился: пункта нет", __t_party(guests: 4, outdoor: false).items.map { $0.title }, ["Торт", "Музыка", "Свечи"], hint: "Если условие ложно, в buildOptional приходит nil — верни пустой массив")
__eq("Ветка if из двух пунктов", __t_party(guests: 4, outdoor: true).items.map { $0.title }, ["Торт", "Пледы", "Зонты", "Свечи"], hint: "buildEither(first:) возвращает пункты ветки if")
__eq("Все условия выполнены", __t_party(guests: 30, outdoor: true).items.count, 5)

func __t_nested(car: Bool, kids: Bool) -> Checklist {
    makeChecklist("Дача") {
        if car {
            "Бензин"
            if kids {
                "Детское кресло"
            }
        }
        "Ключи"
    }
}
__eq("Вложенные if: оба выполнены", __t_nested(car: true, kids: true).items.map { $0.title }, ["Бензин", "Детское кресло", "Ключи"])
__eq("Вложенные if: внешний не выполнен", __t_nested(car: false, kids: true).items.map { $0.title }, ["Ключи"])

__eq("Шаблон поездки за границу на 5 дней", tripChecklist(abroad: true, days: 5).items.map { $0.title }, ["Билеты", "Зарядка для телефона", "Загранпаспорт", "Страховка", "Чемодан"])
__eq("Шаблон поездки: ровно 3 дня — рюкзак", tripChecklist(abroad: false, days: 3).items.map { $0.title }, ["Билеты", "Зарядка для телефона", "Рюкзак"], hint: "buildEither(second:) возвращает пункты ветки else")
```

## @rules
- must: /@resultBuilder/ :: Пометь построитель атрибутом `@resultBuilder`.
- must: /static\s+func\s+buildExpression\s*\(\s*_\s+\w+\s*:\s*String\s*\)/ :: Нужен метод `static func buildExpression(_ title: String) -> [ChecklistItem]`.
- must: /@ChecklistBuilder\s+items\s*:/ :: Пометь параметр-замыкание построителем: `@ChecklistBuilder items: () -> [ChecklistItem]`.

## @hint1
Построитель — это структура с пометкой `@resultBuilder` над ней. Внутри — пять статических методов, и все возвращают массив пунктов.

`buildExpression` получает одну строку из блока и делает из неё массив из одного пункта. `buildBlock` получает сразу все части блока — каждая часть уже массив пунктов. Параметр у него variadic, внутри он выглядит как массив массивов. Его нужно «расплющить» в один массив — для этого есть `flatMap`.

`buildOptional` получает опциональный массив: пункты из `if` или `nil`. Замени `nil` на пустой массив. Оба `buildEither` просто возвращают то, что получили: Swift сам решит, какую ветку собрать.

Функция `makeChecklist` — обычная функция, у второго параметра которой есть пометка построителя прямо перед меткой. Внутри вызови замыкание, чтобы получить пункты, и создай из них `Checklist`.

## @hint2
Два самых важных метода построителя:

```swift
static func buildExpression(_ title: String) -> [ChecklistItem] {
    return [ChecklistItem(title: title)]
}

static func buildBlock(_ parts: [ChecklistItem]...) -> [ChecklistItem] {
    return parts.flatMap { $0 }
}
```

А так пометка ставится на параметр-замыкание:

```swift
func makeChecklist(_ title: String, @ChecklistBuilder items: () -> [ChecklistItem]) -> Checklist {
    // вызови items()
}
```

## @hint3
Осталось три пропуска:

```swift
@resultBuilder
struct ChecklistBuilder {
    static func buildExpression(_ title: String) -> [ChecklistItem] {
        return [ChecklistItem(title: title)]
    }

    static func buildBlock(_ parts: [ChecklistItem]...) -> [ChecklistItem] {
        return parts.flatMap { $0 }
    }

    static func buildOptional(_ part: [ChecklistItem]?) -> [ChecklistItem] {
        return part ?? ___
    }

    static func buildEither(first part: [ChecklistItem]) -> [ChecklistItem] {
        return part
    }

    static func buildEither(second part: [ChecklistItem]) -> [ChecklistItem] {
        return ___
    }
}

func makeChecklist(_ title: String, @ChecklistBuilder items: () -> [ChecklistItem]) -> Checklist {
    return Checklist(title: title, items: ___)
}
```

В первом пропуске — что вернуть, если условие `if` ложно. Во втором — пункты ветки `else`. В третьем — вызов замыкания.

## @hint4
Вот готовое решение:

{{solution}}

**Что делает Swift с шаблоном.** Внутри замыкания с пометкой `@ChecklistBuilder` каждая строка `"Билеты"` сначала проходит через `buildExpression` и становится `[ChecklistItem(title: "Билеты")]`. Блок внутри `if abroad` собирается своим `buildBlock`, а потом передаётся в `buildOptional` — целиком или как `nil`. Ветки `if days > 3` и `else` уходят в `buildEither(first:)` и `buildEither(second:)`. В конце все части получает внешний `buildBlock` и склеивает их в один массив.

**Почему везде `[ChecklistItem]`.** Одна строка — это один пункт, а `if` может дать и два пункта, и ни одного. Массив подходит для всех случаев: пустой, из одного пункта, из нескольких. Раз тип у всех методов один, части свободно передаются друг другу.

**Зачем `flatMap`.** Variadic-параметр `parts` внутри метода — это массив массивов: `[[Билеты], [Зарядка], [Загранпаспорт, Страховка], [Чемодан]]`. `flatMap { $0 }` раскладывает их в один плоский массив, сохраняя порядок.

**Что дала пометка на параметре.** `@ChecklistBuilder items: () -> [ChecklistItem]` говорит Swift: замыкание, которое сюда передают, нужно собирать построителем. Поэтому в шаблоне нет ни `return`, ни `append`. А `makeChecklist` просто вызывает `items()` и получает готовый массив.

**Типичные ошибки:**

- забыть `buildEither` — шаблон с `if ... else` не соберётся: Swift напишет, что не умеет такую конструкцию с этим построителем;
- `buildBlock(_ parts: ChecklistItem...)` — тогда `if` не сможет передать в него свой массив, и типы не сойдутся;
- в `makeChecklist` написать `items` без скобок — это само замыкание, а не его результат.
