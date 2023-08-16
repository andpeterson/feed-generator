import express from 'express'
import { AppContext } from './config'

const makeRouter = (ctx: AppContext) => {
  const router = express.Router()

  router.get('/addMember/:userHandle/:userDID', (req, res) => {
    if (!ctx.cfg.serviceDid.endsWith(ctx.cfg.hostname)) {
      return res.sendStatus(404)
    }

    //insert into pv_members values('did:plc:4ndyufcdqvuihxwsicuaboru', '@progressivevictory.win');
    // TODO: I need to cleanup data being passed in
    const dbRes = ctx.db
      .insertInto('pv_members')
      .values({
        did: 'did:plc:' + req.params.userDID,
        handle: '@' + req.params.userHandle
      })
      .onConflict((oc) => oc.doNothing())
      .execute()
    //TODO: proper responses based on dbRes
    res.sendStatus(200);
  })

  router.get('/.well-known/did.json', (_req, res) => {
    if (!ctx.cfg.serviceDid.endsWith(ctx.cfg.hostname)) {
      return res.sendStatus(404)
    }
    res.json({
      '@context': ['https://www.w3.org/ns/did/v1'],
      id: ctx.cfg.serviceDid,
      service: [
        {
          id: '#bsky_fg',
          type: 'BskyFeedGenerator',
          serviceEndpoint: `https://${ctx.cfg.hostname}`,
        },
      ],
    })
  })

  return router
}
export default makeRouter


