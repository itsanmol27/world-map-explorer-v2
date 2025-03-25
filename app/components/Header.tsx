import Image from "next/image";
import { FaQuestionCircle } from "react-icons/fa";

const Header = () => {
    return (
        <header className=" w-full flex items-center justify-center">
            <div className=" w-full flex items-center justify-between ">
                <div className=" flex items-center justify-center">
                    <Image src="/map-logo.png" alt="Map Logo" height={50} width={50} />
                    <p><b>World-Map-Explorer</b></p>
                </div>
                <div className="">
                    <button className=" flex items-center gap-2" title="Help">
                        Help <FaQuestionCircle />
                    </button>
                </div>
            </div>
        </header>
    );
}

export default Header;