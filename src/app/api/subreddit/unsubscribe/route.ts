import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { SubredditSubscriptionValidator } from '@/lib/validators/subreddit'
import { z } from 'zod'

export async function POST(req: Request) {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { subredditId } = SubredditSubscriptionValidator.parse(body)

    // check if user has already subscribed to subreddit
    const subscriptionExists = await db.subscription.findFirst({
      where: {
        subredditId,
        userId: session.user.id,
      },
    })

    if (!subscriptionExists) {
      return new Response("You are not subscribed to this LocateMe.", {
        status: 400,
      })
    }
     //check if the user is the creator of LocateMe
    const subreddit = await db.subreddit.findFirst({
        where: {
            id: subredditId,
            creatorId: session.user.id,

        }
    })

    if(subreddit) {
        return new Response('You cant unsubscribe to your own LocateMe', {
            status: 400,
        })
    }

    // create subreddit and associate it with the user
    await db.subscription.delete({
      where: {
        userId_subredditId: {
            subredditId,
            userId: session.user.id, 
        }
      }
    })

    return new Response(subredditId)
  } catch (error) {
    if(error instanceof z.ZodError) {
        return new Response('Invalid Request Data', {status: 422})
      }
      return new Response('Could not Unsubscribe, Please Try again Later', {status: 500})
    
  }
}