const CourseService = require('../../../services/courses.service');
const { faker } = require('@faker-js/faker');


const evaluationId = faker.number.int();
const userId = faker.number.int();
const lextrackingId = faker.number.int();
const name = faker.lorem.word();

const evaluationMock = {
	id: evaluationId,
	idUser: userId,
	idLextracking: lextrackingId,
	name: name,
	active: 1,
	json_data: {
		id: evaluationId,
		name: name,
		user: {
			id: userId,
			name: faker.person.firstName(),
			idLextracking: lextrackingId,
		},
		fecha: faker.date.recent(),
		users: [],
		resources: [],
		json_pagos: [],
		indicadores: {
			desempeño: [
				{
					name: faker.lorem.word(),
					total: faker.number.int({ min: 1, max: 5 })
				},
				{
					name: faker.lorem.word(),
					total: faker.number.int({ min: 1, max: 5 })
				},

			],
			habilidades: [
				{
					name: faker.lorem.word(),
					total: faker.number.int({ min: 1, max: 5 })
				},
				{
					name: faker.lorem.word(),
					total: faker.number.int({ min: 1, max: 5 })
				},
			],
			factorHumano: [
				{
					name: faker.lorem.word(),
					total: faker.number.int({ min: 1, max: 5 })
				},
				{
					name: faker.lorem.word(),
					total: faker.number.int({ min: 1, max: 5 })
				},

			]
		},
		observaciones: faker.lorem.sentence(),
		json_evaluaciones: []
	},
	json_clases: [],
	json_pagos: [],
	json_evaluaciones: [],
	dateCreated: faker.date.recent(),
	dateEdited: faker.date.recent()
}

const formattedEvaluation = {
	...evaluationMock.json_data,
	id: evaluationMock.id,
	clases: evaluationMock.json_clases,
	pagos: evaluationMock.json_pagos,
	evaluaciones: evaluationMock.json_evaluaciones,
}

const mockQuery = jest.fn();

global.conn = {
	query: mockQuery
}


describe("coursesService", function () {
	it("should be defined", function () {
		expect(CourseService).toBeDefined();
	});

	describe("one", function () {
		it("should 'one' method return an object when is saved on database", async function () {
			mockQuery.mockResolvedValueOnce([evaluationMock]);

			const result = await CourseService.one(evaluationId);
			const expectedResponse = { response: formattedEvaluation };

			expect(result).toEqual(expectedResponse);

		});

		it("should 'one' method return an error object when is not saved on database", async function () {
			mockQuery.mockResolvedValueOnce([]);

			const result = await CourseService.one(evaluationId);
			const errorMessage = 'No se pudo obtener el curso con la ID proporcionada';
			const expectedResponse = { error: errorMessage, trace: new Error(errorMessage) };

			expect(result).toEqual(expectedResponse);
		});
	})

	describe("insert", function () {
		it("should 'insert' method return an object when is saved on database", async function () {
			mockQuery.mockResolvedValueOnce({ insertId: evaluationId });

			const result = await CourseService.insert(evaluationMock.json_data, userId);

			const expectedResponse = { response: `Curso creado correctamente` };

			expect(result).toEqual(expectedResponse);
		});

		it("should 'insert' method return an error object when is not saved on database", async function () {
			mockQuery.mockRejectedValueOnce(new Error('Error al ingresar curso'));

			const result = await CourseService.insert(evaluationMock.json_data, userId);

			const expectedResponse = { error: 'Error al ingresar curso', stack: new Error('Error al ingresar curso') };

			expect(result).toEqual(expectedResponse);
		});

	});

	describe("copy", function () {
		it("should 'copy' method return an object when is saved on database", async function () {
			jest.spyOn(CourseService, 'one').mockResolvedValueOnce({ response: formattedEvaluation });
			jest.spyOn(CourseService, 'insert').mockResolvedValueOnce({ response: `Curso creado correctamente` });

			const result = await CourseService.copy(evaluationId, userId);

			const expectedResponse = { response: `Curso creado correctamente` };

			expect(result).toEqual(expectedResponse);
			expect(CourseService.insert).toHaveBeenCalledWith({ ...formattedEvaluation, name: `Copy  ${formattedEvaluation.name}` }, userId);
		});

		it("should 'copy' method return an error object when is not saved on database", async function () {
			jest.spyOn(CourseService, 'one').mockResolvedValueOnce({ error: 'No se pudo obtener el curso' });

			const result = await CourseService.copy(evaluationId, userId);

			const expectedResponse = { error: 'No se pudo obtener el curso', stack: new Error('No se pudo obtener el curso') };

			expect(result).toEqual(expectedResponse);

		});

	});




});
