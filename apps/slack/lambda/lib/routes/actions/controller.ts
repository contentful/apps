import { asyncHandler } from '../../utils';

export class ActionsController {
  /**
   * @openapi
   * /api/actions:
   *   post:
   *      description: |
   *        Endpoint to be called when action is triggered from the generated slack message.
   *        Slack, by default, generates a message with a button and general practise is to return 200 for a noop button
   *      responses:
   *        200:
   *          description: OK
   */
  post = asyncHandler(async (request, response) => {
    response.status(200).send();
  });
}
