import React from "react";
import Button from "../ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import NFTPropertiesTab from "./NFTPropertiesTab";

const TabsForNFT = () => {
  const [tab, setTab] = React.useState("Details");
  const tabs = ["Details", "Properties", "About"];

  const handleSelectTabs = (tab: string) => {
    setTab(tab);
  };

  const tabVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  const renderTabContent = () => {
    switch (tab) {
      case "Details":
        return (
          <div>
            <h2 className="font-medium text-2xl mb-5">Description</h2>
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit.
              Perferendis, cupiditate. Hic cumque minus dolores sequi doloribus
              corporis aliquid nulla pariatur, eum fuga cupiditate? Reiciendis
              veritatis fugiat quam voluptatum molestiae eum! Inventore beatae
              quod non officiis fugiat! Ipsam doloremque, possimus inventore
              dolores est praesentium, odio deleniti facere harum magni
              reprehenderit reiciendis earum. Qui ab eveniet perferendis, sequi
              minima recusandae saepe, cum excepturi aut mollitia iure error
              corporis. Beatae eveniet animi, in fugiat similique atque maiores
              veritatis possimus, ab incidunt deserunt reprehenderit commodi, a
              doloremque error recusandae nihil. Sunt molestias necessitatibus
              dolorem iste sapiente aspernatur impedit ipsum veniam repellendus?
              Deleniti natus distinctio consectetur eos quas asperiores
              cupiditate laboriosam. Voluptas harum nam adipisci nostrum
              cupiditate ea inventore obcaecati iste perspiciatis corrupti
              delectus in incidunt ad, suscipit veritatis? Eveniet magnam
              recusandae asperiores! Reiciendis asperiores error tempore
              quibusdam vero quam delectus possimus modi eum temporibus?
            </p>
            <div className="mt-8">
              <h2 className="font-medium text-2xl mb-5">Details</h2>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <p>Token standard: </p>
                  <p>Ethereum (ERC-721)</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p>Token ID: </p>
                  <p>373891379137634748927913713798</p>
                </div>
              </div>
            </div>
          </div>
        );
      case "Properties":
        return <NFTPropertiesTab />;
      case "About":
        return (
          <div>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptatum
            rerum quae sit aliquid id quisquam ab nobis delectus et iste.
            Suscipit facere eligendi harum? Temporibus corrupti corporis eveniet
            est sed obcaecati! Beatae, blanditiis dolorum omnis deleniti dolore
            ad atque! Delectus fugiat vel asperiores in amet consectetur
            corrupti quis voluptas magnam temporibus sed a, animi doloribus
            optio vero exercitationem? Adipisci praesentium blanditiis et
            possimus suscipit quae commodi, a impedit temporibus sapiente velit
            sunt eaque vel vitae illo labore doloribus! Labore saepe quaerat
            perferendis totam dolores hic soluta voluptatum, laborum quod veniam
            blanditiis dicta ut tenetur minus, laudantium eum voluptate?
            Necessitatibus repudiandae officia, accusantium obcaecati dolore
            tenetur, molestias nobis natus amet corporis minus ipsa eius? Soluta
            culpa repudiandae voluptatem tempore maxime reprehenderit molestias
            excepturi animi. Nobis asperiores est ducimus nisi saepe quasi?
          </div>
        );
      case "Bids":
        return <div>Bids Content</div>;
      default:
        return null;
    }
  };

  return (
    <section>
      <div className="flex items-center justify-center gap-6">
        {tabs.map((tabName) => (
          <div key={tabName} className="relative">
            <Button
              text={tabName}
              onclick={() => handleSelectTabs(tabName)}
              style="pb-2"
            />
            {tab === tabName && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                layoutId="underline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                }}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-5 bg-secondary bg-opacity-30 w-full rounded-lg p-8 h-[300px] custom-scrollbar overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default TabsForNFT;
