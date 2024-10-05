import PostEditor from "@/components/editor/post-editor";
import TrendsSidebar from "@/components/trends-sidebar";
import ForYouFeed from "./for-you-feed";
import FollowingFeed from "./following-feed";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// ################################################################################################

export default function Home() {
  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <PostEditor />
        <Tabs defaultValue="for-you">
          <TabsList>
            <TabsTrigger value="for-you">For You</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>
          <TabsContent value="for-you">
            <ForYouFeed />
          </TabsContent>
          <TabsContent value="following">
            <FollowingFeed />
          </TabsContent>
        </Tabs>
      </div>
      <TrendsSidebar />
    </main>
  );
}
