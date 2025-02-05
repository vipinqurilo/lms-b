const defaultAvailability = [
    {
        "day": "sun",
        "slots": Array.from({ length: 48 }, () => true)
    },
    {
        "day": "mon",
        "slots": Array.from({ length: 48 }, () => true)
    },
    {
        "day": "tue",
        "slots": Array.from({ length: 48 }, () => true)
    },
    {
        "day": "wed",
        "slots": Array.from({ length: 48 }, () => true)
    },
    {
        "day": "thu",
        "slots": Array.from({ length: 48 }, () => true)
    },
    {
        "day": "fri",
        "slots": Array.from({ length: 48 }, () => true)
    },
    {
        "day": "sat",
        "slots": Array.from({ length: 48 }, () => true)
    }
]

module.exports={
    defaultAvailability
}