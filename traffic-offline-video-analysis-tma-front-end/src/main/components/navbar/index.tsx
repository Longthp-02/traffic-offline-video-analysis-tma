import Logo from "@/assets/TMALogo.png"
import Link from "./Link"
import DropdownLanguageSelector from "./DropdownLanguageSelector"
import { useAppStore } from "@/main/app/store"
import { GoToPage } from "@/types/action"
import { Page } from "@/types/type"

type Props = {}

const Navbar = (props: Props) => {
    const { dispatcher } = useAppStore(); // Get the dispatcher
    // Navigation handler
    const handleNavigation = (page: Page) => {
        dispatcher(new GoToPage(page)); // Dispatch the action to change the current page
    };
    const flexBetween = "flex items-center justify-between"
    const navBarBackground = "bg-[#2a7ef9]"
    return <nav>
        <div
            className={`${navBarBackground} ${flexBetween} fixed top-0 z-30 w-full left-0 right-0 py-6`}
        >
            <div className={`${flexBetween} mx-auto w-5/6`}>
                <div className={`${flexBetween} w-full gap-16`}>
                    {/* Left Side */}
                    <img src={Logo} alt="logo" />
                    <p className={'${flexBetween} text-white font-inter w-full'}>Offline CamGuard Traffic</p>

                    {/* Right Side */}
                    <div className={`${flexBetween} w-full`}>
                        <div className={`${flexBetween} gap-8 text-sm ml-40`}>
                            <Link page="Home" isInternal={true} onClick={() => handleNavigation(Page.HOMEPAGE)} />
                            <Link page="Product" />
                            <Link page="Contact" />
                        </div>
                        <div className={`${flexBetween} gap-8`} >
                            <DropdownLanguageSelector />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </nav>
}

export default Navbar