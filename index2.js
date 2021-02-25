const a = {
    hello:1,
    world:2
}

const {hello, world:b } = { ...a }
console.log({hello, b})