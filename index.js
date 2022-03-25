import { Router, listen } from 'worktop';
import faunadb from 'faunadb';
import { getFaunaError } from './utils.js';

const router = new Router();

const faunaClient = new faunadb.Client({
  secret: FAUNA_SECRET,
});

const { 
  Create, 
  Call, 
  Format, 
  ToTime, 
  Date, 
  Now, 
  Collection, 
  Lambda, 
  Match, 
  Map, 
  Index, 
  Get, 
  Ref, 
  Paginate,
  Delete, 
  Let, 
  Var, 
  Update
} = faunadb.query;

listen(router.run);

router.add('GET', '/', async (request, response) => {
  response.send(200, 'hello world');
});

router.add('GET', '/shipping', async (request, response) => {
  try {
    const shippingDocuments = await faunaClient.query(
      Map(
        Paginate(
          Match(Index("All_shipping"))
        ),
        Lambda(ref => Get(ref))
      )
    )

    response.send(200, shippingDocuments);
  } catch (error) {
    const faunaError = getFaunaError(error);

    response.send(faunaError.status, faunaError);
  }
});

router.add('GET', '/shipping/current-notifications', async (request, response) => {
  try {
   const currentTimestamp = Format('%tQ', Now())
   const shippingDateDocuments = await faunaClient.query(Call("GetDate", currentTimestamp))

    if (shippingDateDocuments) {
      response.send(200, shippingDateDocuments);
    } else {
      response.send(200, []);
    }

  } catch (error) {
    const faunaError = getFaunaError(error);

    response.send(faunaError.status, faunaError);
  }
});

router.add('POST', '/shipping', async (request, response) => {
  try {
    const { startDate, endDate, message } = await request.body();
    const result = await faunaClient.query(
      Create(
        Collection('Shipping'),
        {
          data: {
            startDate: Format('%tQ', ToTime(Date(startDate))),
            endDate: Format('%tQ', ToTime(Date(endDate))),
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

router.add('PATCH', '/shipping/:shippingDateId/edit', async (request, response) => {
  try {
    const shippingDateId = request.params.shippingDateId;
    const { startDate, endDate, message } = await request.body();
    const result = await faunaClient.query(
      Let(
        { shippingRef: Ref(Collection('Shipping'), shippingDateId) },
        Update(
          Var('shippingRef'),
          {
            data: {
              startDate,
              endDate,
              message
            }
          }
        )
      )
    );

    response.send(200, result);
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
// --header 'Content-Type: application/json' \
// --request GET \
// http://127.0.0.1:8787/shipping

// curl \
// --header 'Content-Type: application/json' \
// --request GET \
// http://127.0.0.1:8787/shipping/current-notifications

// curl \
// --data '{"startDate": "2022-03-25", "endDate": "2022-03-26", "message": "TODAYS DATE TOMORROW EXPIRE"}' \
// --header 'Content-Type: application/json' \
// --request POST \
// http://127.0.0.1:8787/shipping

// curl \
// --data '{"startDate": "4", "endDate": "5", "message": "UPDATED MESSAGE"}' \
// --header 'Content-Type: application/json' \
// --request PATCH \
// http://127.0.0.1:8787/shipping/327123234559361616/edit

// curl \
// --header 'Content-Type: application/json' \
// --request DELETE \
// http://127.0.0.1:8787/shipping/327124149207040592

