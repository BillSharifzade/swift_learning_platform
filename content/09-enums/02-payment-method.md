---
title: Способ оплаты
concept: Сырые значения перечисления — rawValue и init?(rawValue:)
---

## @description

### Контекст
На экране заказа есть строка со способом оплаты. Сам способ хранится на сервере, и сервер присылает его коротким кодом: `card`, `cash`, `sbp` или `business_account`. Когда пассажир выбирает другой способ, приложение отправляет на сервер такой же код.

Бэкенд-разработчик предупреждает: «Коды у нас пишутся через подчёркивание, так принято на сервере. И ещё: скоро появятся новые способы оплаты, например `crypto`. Старая версия приложения о них не знает, но падать от незнакомого кода не должна».

Значит, нужно уметь превращать строку в значение перечисления и обратно. И спокойно переживать строку, для которой варианта нет.

### Новое в Swift
У каждого варианта перечисления может быть **сырое значение** (по-английски raw value) — постоянное значение, которое закреплено за вариантом. Обычно это тот самый код, которым вариант записан на сервере или в настройках.

Чтобы включить сырые значения, после имени перечисления ставят двоеточие и их тип:

```swift
enum Theme: String {
    case light
    case dark
    case system = "auto"
}
```

Здесь у каждого варианта есть сырое значение типа `String`. Если его не указать, Swift возьмёт имя варианта: у `.light` это `"light"`, у `.dark` — `"dark"`. Если код отличается от имени, его пишут после знака `=`: у `.system` сырое значение — `"auto"`.

**Из варианта в строку.** Сырое значение лежит в свойстве `rawValue`:

```swift
let theme = Theme.system
print(theme.rawValue)        // auto
print(Theme.dark.rawValue)   // dark
```

**Из строки в вариант.** Вместе с сырыми значениями перечисление получает готовый инициализатор `init?(rawValue:)`. Знак вопроса тебе знаком по структурам: такой инициализатор может не сработать. Строка ведь бывает любой, а вариантов всего три. Поэтому результат — опционал:

```swift
let saved = Theme(rawValue: "dark")      // Theme? - внутри .dark
let broken = Theme(rawValue: "pink")     // nil: такого кода нет
```

Дальше с ним работают как с любым опционалом — через `if let` или `guard let`:

```swift
func themeNote(code: String) -> String {
    if let theme = Theme(rawValue: code) {
        return "Сохранённая тема: \(theme.rawValue)"
    } else {
        return "Тема по умолчанию"
    }
}
```

Сырые значения сравниваются точно, буква в букву: `"Dark"` или `"dark "` с пробелом дадут `nil`.

> 💡 Сырые значения бывают и числами: `enum Rating: Int { case bad = 1, normal, good }`. Swift продолжит счёт сам: у `.normal` будет 2, у `.good` — 3.

### Задача
1. Объяви перечисление `PaymentMethod` с сырыми значениями типа `String`. В нём четыре варианта: `card`, `cash`, `sbp`, `businessAccount`. Сырые значения должны совпадать с кодами сервера: `"card"`, `"cash"`, `"sbp"`, `"business_account"`.
2. Функция `paymentTitle(for:)` уже написана. Она заработает, как только появится перечисление.
3. Допиши функцию `paymentLabel(serverCode:)`. Она получает код от сервера. Если такой способ оплаты есть — возвращает слово `Оплата:`, пробел и название способа из `paymentTitle(for:)`, например `Оплата: Наличные`. Если такого кода нет — возвращает `Способ оплаты не выбран`.
4. Допиши функцию `paymentQuery(for:)`. Она возвращает строку для запроса на сервер: `payment=` и код способа, например `payment=cash`.

Строку в вариант превращай через `PaymentMethod(rawValue:)`, а код для сервера бери из `rawValue`.

### Пример
```swift
PaymentMethod.businessAccount.rawValue    // "business_account"
paymentLabel(serverCode: "sbp")           // "Оплата: СБП"
paymentLabel(serverCode: "crypto")        // "Способ оплаты не выбран"
paymentQuery(for: .businessAccount)       // "payment=business_account"
```

Проба в конце кода напечатает:

```text
Оплата: СБП
Способ оплаты не выбран
payment=business_account
```

## @starter
```swift
// 1. Объяви перечисление PaymentMethod с сырыми значениями типа String.
//    Варианты: card, cash, sbp, businessAccount.
//    Коды сервера: "card", "cash", "sbp", "business_account"


// 2. Название способа оплаты для экрана. Эта функция уже готова
func paymentTitle(for method: PaymentMethod) -> String {
    switch method {
    case .card:
        return "Банковская карта"
    case .cash:
        return "Наличные"
    case .sbp:
        return "СБП"
    case .businessAccount:
        return "Бизнес-аккаунт"
    }
}

// 3. Подпись на экране заказа по коду от сервера:
//    "Оплата: Наличные" или "Способ оплаты не выбран"
func paymentLabel(serverCode: String) -> String {
    // Замени заглушку: преврати serverCode в PaymentMethod
    return ""
}

// 4. Строка для запроса на сервер: "payment=" и код способа оплаты
func paymentQuery(for method: PaymentMethod) -> String {
    // Замени заглушку: код лежит в сыром значении
    return ""
}

// Проба: что увидит пассажир и что уйдёт на сервер
print(paymentLabel(serverCode: "sbp"))
print(paymentLabel(serverCode: "crypto"))
print(paymentQuery(for: .businessAccount))
```

## @solution
```swift
// 1. Объяви перечисление PaymentMethod с сырыми значениями типа String.
//    Варианты: card, cash, sbp, businessAccount.
//    Коды сервера: "card", "cash", "sbp", "business_account"
enum PaymentMethod: String {
    case card
    case cash
    case sbp
    case businessAccount = "business_account"
}

// 2. Название способа оплаты для экрана. Эта функция уже готова
func paymentTitle(for method: PaymentMethod) -> String {
    switch method {
    case .card:
        return "Банковская карта"
    case .cash:
        return "Наличные"
    case .sbp:
        return "СБП"
    case .businessAccount:
        return "Бизнес-аккаунт"
    }
}

// 3. Подпись на экране заказа по коду от сервера:
//    "Оплата: Наличные" или "Способ оплаты не выбран"
func paymentLabel(serverCode: String) -> String {
    guard let method = PaymentMethod(rawValue: serverCode) else {
        return "Способ оплаты не выбран"
    }
    return "Оплата: \(paymentTitle(for: method))"
}

// 4. Строка для запроса на сервер: "payment=" и код способа оплаты
func paymentQuery(for method: PaymentMethod) -> String {
    return "payment=\(method.rawValue)"
}

// Проба: что увидит пассажир и что уйдёт на сервер
print(paymentLabel(serverCode: "sbp"))
print(paymentLabel(serverCode: "crypto"))
print(paymentQuery(for: .businessAccount))
```

## @tests
```swift
__eq("Сырое значение варианта .card - код card", PaymentMethod.card.rawValue, "card")
__eq("Сырое значение варианта .cash - код cash", PaymentMethod.cash.rawValue, "cash")
__eq("Сырое значение варианта .sbp - код sbp", PaymentMethod.sbp.rawValue, "sbp")
__eq("Сырое значение варианта .businessAccount - код business_account", PaymentMethod.businessAccount.rawValue, "business_account", hint: "Здесь имя варианта и код сервера различаются. Сырое значение нужно указать явно: case businessAccount = \"business_account\"")
__ok("Код sbp превращается в вариант .sbp", PaymentMethod(rawValue: "sbp") == .sbp)
__ok("Для неизвестного кода crypto получается nil", PaymentMethod(rawValue: "crypto") == nil)
__eq("Подпись для кода card", paymentLabel(serverCode: "card"), "Оплата: Банковская карта", hint: "Известный код: верни слово Оплата, двоеточие, пробел и результат paymentTitle(for:)")
__eq("Подпись для кода cash", paymentLabel(serverCode: "cash"), "Оплата: Наличные", hint: "Название должно зависеть от кода: преврати serverCode в вариант и передай его в paymentTitle(for:)")
__eq("Подпись для кода sbp", paymentLabel(serverCode: "sbp"), "Оплата: СБП")
__eq("Подпись для кода business_account", paymentLabel(serverCode: "business_account"), "Оплата: Бизнес-аккаунт", hint: "Сервер присылает код с подчёркиванием: business_account. Проверь сырое значение варианта .businessAccount")
__eq("Неизвестный код crypto", paymentLabel(serverCode: "crypto"), "Способ оплаты не выбран", hint: "Для кода, которого нет среди сырых значений, PaymentMethod(rawValue:) возвращает nil. В этом случае верни текст: Способ оплаты не выбран")
__eq("Пустая строка вместо кода", paymentLabel(serverCode: ""), "Способ оплаты не выбран", hint: "Пустая строка - тоже неизвестный код")
__eq("Имя варианта businessAccount - это не код сервера", paymentLabel(serverCode: "businessAccount"), "Способ оплаты не выбран", hint: "Сервер знает только код business_account. Строка businessAccount не должна превращаться в способ оплаты")
__eq("Запрос для оплаты картой", paymentQuery(for: .card), "payment=card", hint: "Верни payment= и сырое значение способа оплаты, без пробелов")
__eq("Запрос для оплаты наличными", paymentQuery(for: .cash), "payment=cash", hint: "Код должен браться из параметра method, а не быть написан в тексте")
__eq("Запрос для оплаты через СБП", paymentQuery(for: .sbp), "payment=sbp")
__eq("Запрос для бизнес-аккаунта", paymentQuery(for: .businessAccount), "payment=business_account", hint: "Вставка \\(method) подставляет имя варианта. Код сервера лежит в method.rawValue")
```

## @rules
- must: /\benum\s+PaymentMethod\s*:\s*String\b/ :: Включи сырые значения: после имени перечисления поставь двоеточие и тип — `enum PaymentMethod: String`.
- must: /\bPaymentMethod\s*\(\s*rawValue\s*:/ :: Преврати код сервера в вариант готовым инициализатором: `PaymentMethod(rawValue: serverCode)`.
- must: /\.rawValue\b/ :: Код для запроса возьми из сырого значения: `method.rawValue`.

## @hint1
Начни с перечисления. Оно объявляется как в прошлой задаче, но после имени `PaymentMethod` стоит двоеточие и тип `String` — так включаются сырые значения. У первых трёх вариантов имя совпадает с кодом сервера, поэтому хватит обычного `case`. У четвёртого имя `businessAccount`, а сервер пишет код через подчёркивание. Для него сырое значение нужно указать явно: после имени варианта знак `=` и код в кавычках.

Теперь `paymentLabel(serverCode:)`. Строку нужно превратить в вариант: напиши имя перечисления и в скобках `rawValue:` с параметром `serverCode`. Получится опционал: кода может и не оказаться среди сырых значений. Разверни его через `if let` или `guard let`. Если вариант нашёлся — передай его в готовую `paymentTitle(for:)` и поставь перед результатом слово «Оплата:» с пробелом. Если нет — верни текст «Способ оплаты не выбран».

В `paymentQuery(for:)` всё наоборот: вариант уже есть, нужна строка. Код лежит в свойстве `rawValue` параметра `method`. Вставь его в текст после `payment=`.

Обе заглушки `return ""` удали.

## @hint2
Вот перечисление с сырыми значениями и функция, которая превращает строку в вариант, — на примере темы оформления:

```swift
enum Theme: String {
    case light
    case dark
    case system = "auto"
}

func themeNote(code: String) -> String {
    guard let theme = Theme(rawValue: code) else {
        return "Тема по умолчанию"
    }
    return "Сохранённая тема: \(theme.rawValue)"
}
```

`Theme(rawValue: code)` возвращает опционал. `guard let` достаёт из него вариант или сразу выходит из функции с запасным текстом.

## @hint3
Перечисление и первая функция почти готовы. Заполни пропуски:

```swift
enum PaymentMethod: ___ {
    case card
    case cash
    case sbp
    case businessAccount = ___
}

func paymentLabel(serverCode: String) -> String {
    guard let method = PaymentMethod(rawValue: ___) else {
        return "Способ оплаты не выбран"
    }
    return "Оплата: \(paymentTitle(for: method))"
}

func paymentQuery(for method: PaymentMethod) -> String {
    return "payment=\(___)"
}
```

В первом пропуске — тип сырых значений. Во втором — код сервера для бизнес-аккаунта, в кавычках. В третьем — строка, которую нужно превратить в вариант. В четвёртом — сырое значение параметра `method`.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** Запись `enum PaymentMethod: String` закрепляет за каждым вариантом строку. Для `card`, `cash` и `sbp` Swift берёт имя варианта. Для `businessAccount` указано своё значение, потому что на сервере код пишется иначе.

В `paymentLabel(serverCode:)` вызов `PaymentMethod(rawValue: serverCode)` ищет вариант с таким сырым значением. Результат — `PaymentMethod?`: либо вариант, либо `nil`. `guard let` проверяет его сразу. Если кода нет, функция возвращает запасной текст и заканчивается. Если есть — дальше `method` уже обычное значение, и его можно передать в `paymentTitle(for:)`. Через `if let` с веткой `else` получилось бы то же самое.

В `paymentQuery(for:)` движение обратное: `method.rawValue` достаёт из варианта его код.

**Почему не написать `switch` по строке.** Можно было бы разобрать `serverCode` вручную: `case "card": ...`, `case "cash": ...`. Но тогда коды жили бы в двух местах: в этом `switch` и там, где собирается запрос. Изменится код на сервере — в одном месте поправят, в другом забудут. Сырые значения хранят соответствие «вариант — код» один раз, прямо в объявлении, и оно работает в обе стороны.

**Почему результат — опционал.** Сервер и приложение обновляются не одновременно. Рано или поздно придёт код, о котором приложение не знает. Опционал заставляет решить заранее, что тогда показать пассажиру.

**Типичные ошибки:**

- забыт `: String` после имени — тогда у вариантов нет `rawValue` и нет инициализатора `PaymentMethod(rawValue:)`;
- у `businessAccount` не указано своё сырое значение — Swift берёт имя варианта, и код `business_account` от сервера не распознаётся;
- в запрос вставлен сам вариант, `\(method)`, — в текст попадает имя `businessAccount`, а не код;
- опционал не развёрнут: `paymentTitle(for: PaymentMethod(rawValue: serverCode))` не соберётся, функция ждёт обычное значение.
