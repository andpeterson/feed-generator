import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return
    const ops = await getOpsByType(evt)

    // This logs the text of every post off the firehose.
    // Just for fun :)
    // Delete before actually using
    // for (const post of ops.posts.creates) {
    //   console.log(post.record.text + '\n-------------------------')
    // }

    // grabs the list of pv members from the database
    const pv_members = await this.db
    .selectFrom('pv_members')
    .selectAll()
    .execute()

    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
    const postsToCreate = ops.posts.creates
      .filter((create) => {
        // only PV posts
        //return create.record.text.toLowerCase().includes('is')
        //create.record.text.toLocaleUpperCase()
        //console.log(create.author.toLowerCase())

        //iterates over members and checks if user did matches any of them
        const authorIsPVmember = pv_members.find( member_entry => member_entry.did === create.author.toLowerCase())
        //const authorIsPVmember = Object.values(PVmembers).includes(create.author.toLowerCase())
        if(authorIsPVmember){
          console.log(create.record.text)
        }
        return authorIsPVmember
      })
      .map((create) => {
        // map PV posts to a db row
        return {
          uri: create.uri,
          cid: create.cid,
          replyParent: create.record?.reply?.parent.uri ?? null,
          replyRoot: create.record?.reply?.root.uri ?? null,
          indexedAt: new Date().toISOString(),
        }
      })

    if (postsToDelete.length > 0) {
      await this.db
        .deleteFrom('post')
        .where('uri', 'in', postsToDelete)
        .execute()
    }
    if (postsToCreate.length > 0) {
      const res = await this.db
        .insertInto('post')
        .values(postsToCreate)
        .onConflict((oc) => oc.doNothing())
        .execute()
    }
  }
}
