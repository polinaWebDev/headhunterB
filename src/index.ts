import { AppDataSource } from "./data-source"
import { Users } from "./entity/Users"


async function Main() {

    AppDataSource.initialize().then(async () => {

    })
}

Main()