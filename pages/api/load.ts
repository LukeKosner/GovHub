import { db } from "@vercel/postgres";
import { NextApiRequest, NextApiResponse } from "next";
import clerk from "@clerk/clerk-sdk-node";
import axios, { AxiosError } from "axios";
import * as cheerio from "cheerio";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  const client = await db.connect();

  const quizlets = await client.sql`SELECT * FROM Quizlets;`;

  const quizletsArray = await Promise.all(
    quizlets.rows.map(async (quizlet) => {
      const user = await clerk.users.getUser(quizlet.clerk);

      const data = fetch(quizlet.url).then((res) => res.text());

      console.log("data", data);
      
      const $ = cheerio.load(await data);

      const title = $(
        "#setPageSetIntroWrapper > div > div > div.SetPage-setTitle > div.SetPage-titleWrapper > h1"
      ).text();

      console.log("title", title);

      return {
        id: quizlet.id,
        url: quizlet.url,
        name: title,
        subject: quizlet.subject,
        created: quizlet.created,
        clerk: quizlet.clerk,
        user: user.firstName + " " + user.lastName,
      };
    })
  );

  console.log("quizletsArray", quizletsArray);

  console.log("hello!");

  return response.status(200).json(quizletsArray);
}
