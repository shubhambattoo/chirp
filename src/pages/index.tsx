import { SignInButton, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";

import { api, type RouterOutputs } from "~/utils/api";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useState } from "react";
import toast from "react-hot-toast";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import Link from "next/link";

dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const { user } = useUser();
  const [input, setInput] = useState("");

  const ctx = api.useContext();

  const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    onSuccess: () => {
      setInput("");
      void ctx.posts.getAll.invalidate();
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      if (errorMessage && errorMessage[0]) {
        toast.error(errorMessage[0]);
      } else {
        toast.error("Failed to post. Try Again later.");
      }
    },
  });

  if (!user) return null;

  return (
    <>
      <div className="flex w-full gap-3">
        <Image
          src={user.profileImageUrl}
          alt="Profile image"
          className="h-14 w-14 rounded-full"
          width={56}
          height={56}
        />
        <input
          placeholder="Type some emojis!"
          className="grow bg-transparent"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (input !== "") {
                mutate({ content: input });
              }
            }
          }}
          disabled={isPosting}
        />
        {input !== "" && !isPosting && (
          <button type="submit" onClick={() => mutate({ content: input })}>
            Post
          </button>
        )}
        {isPosting && (
          <div className="flex flex-col justify-center">
            <LoadingSpinner size={20} />
          </div>
        )}
      </div>
    </>
  );
};

type PostWithUser = RouterOutputs["posts"]["getAll"][number];

const PostView = (props: PostWithUser) => {
  const { post, author } = props;

  return (
    <div className="flex gap-3 border-b border-slate-400 p-4">
      {" "}
      <Image
        src={author.profileImageUrl}
        alt="Profile image"
        className="h-14 w-14 rounded-full"
        width={56}
        height={56}
      />
      <div className="flex flex-col">
        <div className="flex gap-3 text-slate-300">
          <Link href={`/@${author.username}`}>
            <span>@{author.username}</span>
          </Link>{" "}
          .{" "}
          <Link href={`/post/${post.id}`}>
            <span className="font-thin">{dayjs(post.createdAt).fromNow()}</span>
          </Link>
        </div>
        <span className="text-xl">{post.content}</span>
      </div>
    </div>
  );
};

const Feed = () => {
  const { data, isLoading: postLoading } = api.posts.getAll.useQuery();

  if (postLoading) return <LoadingPage />;

  if (!data) return <div>Something went wrong</div>;

  return (
    <div className="flex flex-col">
      {data?.map((fullpost) => (
        <PostView {...fullpost} key={fullpost.post.id} />
      ))}
    </div>
  );
};

const Home: NextPage = () => {
  const { isSignedIn, isLoaded: userLoaded } = useUser();

  // start fetching asap
  api.posts.getAll.useQuery();

  // Show empty div if user is not laoded
  if (!userLoaded) return <div />;

  return (
    <>
     
      <main className="flex h-screen justify-center">
        <div className="h-full w-full border-x border-slate-400 md:max-w-2xl">
          <div className="flex border-b border-slate-400 p-4">
            {!isSignedIn && (
              <div className="flex justify-center">
                <SignInButton />
              </div>
            )}
            {isSignedIn && <CreatePostWizard />}
          </div>
          <Feed />
        </div>
      </main>
    </>
  );
};

export default Home;
