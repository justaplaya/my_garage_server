const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const cors = require("cors");
const schema = require("./schema");
const { GraphQLError } = require("graphql/error");
const app = express();
const WSServer = require("express-ws")(app);
const aWss = WSServer.getWss();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.options("*", cors());
app.use(express.json());

app.ws("/", () => {});

/** отдаёт рандомное число, помноженное на multiplier и округлённое вверх */
const getRand = (multiplier) => Math.ceil(Math.random() * multiplier);
const getRandId = () => Date.now() * Math.trunc(Math.random() * 10000);

const periods = ["week", "month", "year"];
const incidents = ["evacuation", "violation", "crash"];

/** отдаёт объект [период]: количество инцидентов  */
const getIncidentData = () =>
  periods.reduce((acc, item, index) => {
    return { ...acc, [item]: getRand(Math.pow(10, index + 1)) };
  }, {});

const createCarFunction = (input) => {
  const id = Date.now();
  const _incidents = incidents.reduce((acc, item) => {
    return { ...acc, [item]: getIncidentData() };
  }, {});

  return {
    id,
    //id: mock.findIndex((i) => i.model === input.model),
    incidents: _incidents,
    ...input,
  };
};
const cars = [
  {
    id: 1,
    brand: "subaru",
    model: "Impreza 2003",
    year: 2005,
    maxSpeed: 329,
    timeUpTo100: 2.3,
    incidents: {
      evacuation: {
        week: 8,
        month: 26,
        year: 948,
      },
      violation: {
        week: 2,
        month: 4,
        year: 843,
      },
      crash: {
        week: 9,
        month: 73,
        year: 840,
      },
    },
  },
  {
    id: 2,
    brand: "chery",
    model: null,
    year: null,
    maxSpeed: null,
    timeUpTo100: null,
    incidents: {
      evacuation: {
        week: 8,
        month: 80,
        year: 754,
      },
      violation: {
        week: 6,
        month: 96,
        year: 745,
      },
      crash: {
        week: 6,
        month: 41,
        year: 398,
      },
    },
  },
  {
    id: 3,
    brand: "mitsubishi",
    model: "Lancer Evo VII",
    year: 2002,
    maxSpeed: 305,
    timeUpTo100: 2.7,
    incidents: {
      evacuation: {
        week: 3,
        month: 44,
        year: 144,
      },
      violation: {
        week: 5,
        month: 24,
        year: 913,
      },
      crash: {
        week: 10,
        month: 28,
        year: 53,
      },
    },
  },
  {
    id: 4,
    brand: "hyundai",
    model: "accent",
    year: 2007,
    maxSpeed: 294,
    timeUpTo100: 3.1,
    incidents: {
      evacuation: {
        week: 8,
        month: 32,
        year: 516,
      },
      violation: {
        week: 8,
        month: 9,
        year: 142,
      },
      crash: {
        week: 10,
        month: 68,
        year: 613,
      },
    },
  },
];

const updateCar = (input) => {
  return cars.find((car) => car.id === input.id);
};
const delay = (ms) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
    // }, 0);
  });
};
const root = {
  getAllCars: async () => {
    await delay(2000);
    return await cars;
  },
  getOneCar: async ({ id }) => {
    await delay(2000);
    if (!cars.find((car) => car.id === Number(id))) {
      throw new GraphQLError("car not found", {
        extensions: {
          code: "404",
        },
      });
    }
    return await cars.find((car) => car.id === Number(id));
  },
  createCar: async ({ input }) => {
    await delay(2000);
    const car = createCarFunction(input);
    cars.push(car);
    return car;
  },
  updateCar: async ({ input }) => {
    await delay(2000);
    const carsCopy = JSON.parse(JSON.stringify(cars));
    const newCar = carsCopy.find((i) => i.id === Number(input.id));
    if (!newCar) return; // exception
    const index = carsCopy.indexOf(newCar);
    newCar.brand = input.brand;
    newCar.model = input.model;
    newCar.year = input.year;
    newCar.maxSpeed = input.maxSpeed;
    newCar.timeUpTo100 = input.timeUpTo100;
    cars.splice(index, 1, newCar);
    return await newCar;
  },
  deleteCar: async ({ input }) => {
    await delay(2000);
    const carsCopy = JSON.parse(JSON.stringify(cars));
    const car = carsCopy.find((i) => i.id === Number(input.id));
    if (!car) return; // exception
    const index = carsCopy.indexOf(car);
    cars.splice(index, 1);
    return {
      id: -1,
      brand: "",
      model: null,
      year: null,
      maxSpeed: null,
      timeUpTo100: null,
    };
    // TODO а можно вообще ничего не возвращать?)
  },
};

const getRandIntBetween = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const getRandIncident = () => {
  const id = getRandId();
  //console.log(cars);
  const car = cars[getRandIntBetween(0, cars.length - 1)];
  const incident = incidents[getRandIntBetween(0, incidents.length - 1)];

  return { id, car, incident };
};

setInterval(async () => {
  await delay(Math.trunc(Math.random() * 10000));
  aWss.clients.forEach((client) => {
    client.send(
      JSON.stringify({ method: "new_incident", data: getRandIncident() })
    );
  });
}, 1500);

app.use(
  "/graphql",
  graphqlHTTP({
    graphiql: true,
    schema,
    rootValue: root,
  })
);

app.listen(PORT, () => console.log("server been running"));
