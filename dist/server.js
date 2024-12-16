"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const data_source_1 = require("./data-source");
const auth_1 = __importDefault(require("./routes/auth"));
const update_1 = __importDefault(require("./routes/update"));
const create_company_1 = __importDefault(require("./routes/create-company"));
const profile_1 = __importDefault(require("./routes/profile"));
const invite_1 = __importDefault(require("./routes/invite"));
const posting_1 = __importDefault(require("./routes/posting"));
const application_1 = __importDefault(require("./routes/application"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: '*' }));
data_source_1.AppDataSource.initialize()
    .then(() => {
    console.log('Server started');
})
    .catch((error) => {
    console.log(error);
});
app.use(express_1.default.json());
//routs
app.use('/auth', auth_1.default);
app.use('/update', update_1.default);
app.use(profile_1.default);
app.use('/create', create_company_1.default);
app.use(invite_1.default);
app.use(posting_1.default);
app.use(application_1.default);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
