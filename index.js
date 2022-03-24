import {Router, listen} from 'worktop';
import faunadb from 'faunadb';
import {getFaunaError} from './utils.js';

const router = new Router();

const faunaClient = new faunadb.Client({
  secret: FAUNA_SECRET,
});

const {Create, Call, Function, CreateIndex, Collection, Documents, Lambda, Match, Map, Index, Get, Ref, Paginate, Sum, Delete, Add, Select, Let, Var, Update} = faunadb.query;

router.add('GET', '/', async (request, response) => {
  response.send(200, 'hello world');
});

listen(router.run);

router.add('GET', '/shipping', async (request, response) => {
  try {

    // Timestamp for now
    const timestampNow = new Date().getTime()
    console.log(timestampNow, 'timeStamp')

    //  CreateIndex({
    //   name: "Shipping_periods",
    //   source: Collection("Shipping"),
    //   values: [
    //     { field: ["data", "startDate"] },
    //     { field: ["data", "endDate"] },
    //     { field: ["ref"] }
    //   ]
    // })

        // Query(
    //   Lambda(
    //     "target",
    //     Map(
    //       Paginate(
    //         Filter(
    //           Match(Index("Shipping_periods")),
    //           Lambda(
    //             ["startDate", "endDate", "ref"],
    //             And(
    //               LTE(Var("startDate"), Var("target")),
    //               GTE(Var("endDate"), Var("target"))
    //             )
    //           )
    //         )
    //       ),
    //       Lambda(["startDate", "endDate", "ref"], Get(Var("ref")))
    //     )
    //   )
    // )

  const shippingDateDocuments = await faunaClient.query(Call("GetDate", 6))

  console.log(shippingDateDocuments, 'shippingDateDocuments')

    if (shippingDateDocuments) {
      response.send(200, shippingDateDocuments);
    } else {
      response.send(200, false);
    }

  } catch (error) {
    const faunaError = getFaunaError(error);

    response.send(faunaError.status, faunaError);
  }
});

router.add('POST', '/shipping', async (request, response) => {
  try {
    const {startDate, endDate, message} = await request.body();

    const result = await faunaClient.query(
      Create(
        Collection('Shipping'),
        {
          data: {
            startDate,
            endDate,
            message
          }
        }
      )
    );

    response.send(200, {
      shippingDocument: result.ref.id
    });
  } catch (error) {
    const faunaError = getFaunaError(error);
    response.send(faunaError.status, faunaError);
  }
});

router.add('DELETE', '/shipping/:shippingDateId', async (request, response) => {
  try {
    const shippingDateId = request.params.shippingDateId;

    const result = await faunaClient.query(
      Delete(Ref(Collection('Shipping'), shippingDateId))
    );

    response.send(200, result);
  } catch (error) {
    const faunaError = getFaunaError(error);
    response.send(faunaError.status, faunaError);
  }
});


// curl \
// --data '{"startDate": "3", "endDate": "5", "message": "THIRD MESSAGE"}' \
// --header 'Content-Type: application/json' \
// --request POST \
// http://127.0.0.1:8787/shipping